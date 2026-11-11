
import mongoose from 'mongoose';

import {
  Membership,
  MembershipStatus,
} from '../src/models/Membership.model';

import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../src/models/MembershipHistory.model';

import { BranchSettings } from '../src/models/BranchSettings.model';

import { autoUnfreezeMembership } from '../src/services/membershipFreeze.service';

import {
  runMembershipExpiryCheck,
  startMembershipExpiryJob,
  stopMembershipExpiryJob,
} from '../src/jobs/membershipExpiry.job';

// Mock auto-unfreeze service.
jest.mock('../src/services/membershipFreeze.service', () => ({
  autoUnfreezeMembership: jest.fn(),
}));

const mockMembership = Membership as any;
const mockHistory = MembershipHistory as any;
const mockBranchSettings = BranchSettings as any;
const mockAutoUnfreeze = autoUnfreezeMembership as jest.Mock;

// Mock MongoDB session and transaction.
const mockSession = {
  withTransaction: jest.fn(),
  endSession: jest.fn(),
};

const createQuery = (data: any) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(data),
});

const createSessionQuery = (data: any) => ({
  session: jest.fn().mockResolvedValue(data),
});

describe('Membership Expiry Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.useFakeTimers();

    // Fixed date for predictable tests.
    jest.setSystemTime(new Date('2026-11-10T08:00:00.000Z'));

    mockSession.withTransaction.mockImplementation(
      async (callback: () => Promise<any>) => callback(),
    );

    mockSession.endSession.mockResolvedValue(undefined);

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(
      mockSession as any,
    );

    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.FROZEN) {
        return createQuery([]);
      }

      if (query.status === MembershipStatus.ACTIVE) {
        return createQuery([]);
      }

      return createQuery([]);
    });

    mockBranchSettings.find.mockReturnValue(createQuery([]));

    mockMembership.findOne.mockReturnValue(
      createSessionQuery(null),
    );

    mockMembership.findOneAndUpdate.mockResolvedValue(null);

    mockHistory.create.mockResolvedValue([]);

    mockAutoUnfreeze.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // --------------------------------------------------
  // TEST 1: Expired ACTIVE membership
  // --------------------------------------------------

  it('should expire an ACTIVE membership when end date has passed', async () => {
    const membership = {
      _id: new mongoose.Types.ObjectId(),
      memberId: new mongoose.Types.ObjectId(),
      branchId: new mongoose.Types.ObjectId(),
      endDate: new Date('2026-11-09T00:00:00.000Z'),
    };

    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.ACTIVE) {
        return createQuery([membership]);
      }

      return createQuery([]);
    });

    mockMembership.findOne.mockReturnValue(
      createSessionQuery({
        ...membership,
        status: MembershipStatus.ACTIVE,
      }),
    );

    mockMembership.findOneAndUpdate.mockResolvedValue({
      ...membership,
      status: MembershipStatus.EXPIRED,
    });

    await runMembershipExpiryCheck();

    expect(mockMembership.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: membership._id,
        status: MembershipStatus.ACTIVE,
      }),
      expect.objectContaining({
        $set: {
          status: MembershipStatus.EXPIRED,
        },
      }),
      expect.objectContaining({
        new: true,
        session: mockSession,
      }),
    );

    expect(mockHistory.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          membershipId: membership._id,
          action: MembershipHistoryAction.EXPIRED,
          previousStatus: MembershipStatus.ACTIVE,
          newStatus: MembershipStatus.EXPIRED,
          metadata: expect.objectContaining({
            source: 'SYSTEM_JOB',
          }),
        }),
      ],
      { session: mockSession },
    );
  });

  // --------------------------------------------------
  // TEST 2: Membership should not expire before end date
  // --------------------------------------------------

  it('should not expire an ACTIVE membership before its end date', async () => {
    const membership = {
      _id: new mongoose.Types.ObjectId(),
      memberId: new mongoose.Types.ObjectId(),
      branchId: new mongoose.Types.ObjectId(),
      endDate: new Date('2026-11-10T00:00:00.000Z'),
    };

    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.ACTIVE) {
        return createQuery([membership]);
      }

      return createQuery([]);
    });

    mockMembership.findOne.mockReturnValue(
      createSessionQuery({
        ...membership,
        status: MembershipStatus.ACTIVE,
      }),
    );

    await runMembershipExpiryCheck();

    expect(mockMembership.findOneAndUpdate).not.toHaveBeenCalled();

    expect(mockHistory.create).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // TEST 3: PENDING memberships should remain untouched
  // --------------------------------------------------

  it('should not process PENDING memberships', async () => {
    await runMembershipExpiryCheck();

    expect(mockMembership.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MembershipStatus.ACTIVE,
      }),
    );

    expect(mockMembership.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MembershipStatus.FROZEN,
      }),
    );

    expect(mockMembership.find).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: MembershipStatus.PENDING,
      }),
    );

    expect(mockHistory.create).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // TEST 4: Auto-unfreeze due memberships
  // --------------------------------------------------

  it('should automatically unfreeze memberships whose freeze period has ended', async () => {
    const membership = {
      _id: new mongoose.Types.ObjectId(),
    };

    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.FROZEN) {
        return createQuery([membership]);
      }

      return createQuery([]);
    });

    mockAutoUnfreeze.mockResolvedValue(true);

    await runMembershipExpiryCheck();

    expect(mockAutoUnfreeze).toHaveBeenCalledWith(
      membership._id.toString(),
    );
  });

  // --------------------------------------------------
  // TEST 5: Not due for auto-unfreeze
  // --------------------------------------------------

  it('should not unfreeze memberships when no freeze period is due', async () => {
    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.FROZEN) {
        return createQuery([]);
      }

      return createQuery([]);
    });

    await runMembershipExpiryCheck();

    expect(mockAutoUnfreeze).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // TEST 6: Expiry history should not be created
  // if guarded status update fails
  // --------------------------------------------------

  it('should not create expiry history if membership was already changed', async () => {
    const membership = {
      _id: new mongoose.Types.ObjectId(),
      memberId: new mongoose.Types.ObjectId(),
      branchId: new mongoose.Types.ObjectId(),
      endDate: new Date('2026-11-09T00:00:00.000Z'),
    };

    mockMembership.find.mockImplementation((query: any) => {
      if (query.status === MembershipStatus.ACTIVE) {
        return createQuery([membership]);
      }

      return createQuery([]);
    });

    mockMembership.findOne.mockReturnValue(
      createSessionQuery({
        ...membership,
        status: MembershipStatus.ACTIVE,
      }),
    );

    // Another process already changed the status.
    mockMembership.findOneAndUpdate.mockResolvedValue(null);

    await runMembershipExpiryCheck();

    expect(mockHistory.create).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // TEST 7: Cron job start/stop
  // --------------------------------------------------

  it('should start and stop the membership expiry cron job', () => {
    expect(() => startMembershipExpiryJob()).not.toThrow();

    // Calling start again should not create another task.
    expect(() => startMembershipExpiryJob()).not.toThrow();

    expect(() => stopMembershipExpiryJob()).not.toThrow();

    // Stopping again should also be safe.
    expect(() => stopMembershipExpiryJob()).not.toThrow();
  });
});
