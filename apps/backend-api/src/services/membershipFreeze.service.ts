import mongoose from 'mongoose';

import { Member } from '../models/Member.model';
import { Membership, MembershipStatus } from '../models/Membership.model';
import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../models/MembershipHistory.model';
import {
  MembershipFreezeRequest,
  FreezeRequestStatus,
} from '../models/MembershipFreezeRequest.model';
import { BranchSettings } from '../models/BranchSettings.model';
import { UserRole } from '../constants/roles.enum';

export interface FreezeActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export interface RequestFreezeInput {
  membershipId: string;
  requestedDays: number;
  reason: string;
}

export interface ReviewFreezeInput {
  requestId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewNotes?: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const fail = (message: string, statusCode = 400): never => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  throw error;
};

const isStaff = (role: UserRole): boolean =>
  [
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ].includes(role);

const validateStaffBranchAccess = (
  branchId: string,
  actor: FreezeActor,
): void => {
  if (!isStaff(actor.role)) {
    return fail('You are not authorized to perform this action.', 403);
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    (!actor.branchId || actor.branchId !== branchId)
  ) {
    return fail('You can access your assigned branch only.', 403);
  }
};

const populateFreezeRequest = (query: any) =>
  query
    .populate('membershipId')
    .populate('memberId', 'memberId firstName lastName email mobile')
    .populate('branchId', 'name code')
    .populate('reviewedBy', 'firstName lastName email');

/**
 * Member submits a freeze request for their own ACTIVE membership.
 */
export const requestMembershipFreeze = async (
  input: RequestFreezeInput,
  actor: FreezeActor,
) => {
  if (actor.role !== UserRole.MEMBER) {
    return fail('Only members can submit freeze requests.', 403);
  }

  if (!mongoose.isValidObjectId(input.membershipId)) {
    return fail('Invalid membership ID.', 400);
  }

  if (
    !Number.isInteger(input.requestedDays) ||
    input.requestedDays < 1 ||
    input.requestedDays > 30
  ) {
    return fail('Freeze duration must be between 1 and 30 days.', 400);
  }

  const reason = input.reason?.trim();

  if (!reason || reason.length > 500) {
    return fail('A valid freeze reason is required (maximum 500 characters).', 400);
  }

  const session = await mongoose.startSession();

  try {
    const requestId = await session.withTransaction(async () => {
      const member = await Member.findOne({
        userId: actor.userId,
      }).session(session);

      if (!member) {
        return fail('Member profile not found.', 404);
      }

      const membership = await Membership.findById(
        input.membershipId,
      ).session(session);

      if (!membership) {
        return fail('Membership not found.', 404);
      }
      

      if (!membership.memberId.equals(member._id)) {
        return fail('You can request a freeze for your own membership only.', 403);
      }

      if (membership.status !== MembershipStatus.ACTIVE) {
        return fail('Only active memberships can be frozen.', 400);
      }

      const settings = await BranchSettings.findOne({
        branchId: membership.branchId,
      }).session(session);

      // Fallback supports older BranchSettings documents.
      const maxFreezeDays = settings?.maxFreezeDays ?? 30;

      if (
        !Number.isInteger(maxFreezeDays) ||
        maxFreezeDays < 0 ||
        maxFreezeDays > 30
      ) {
        return fail('Branch freeze settings are invalid. Contact the administrator.', 400);
      }

      if (maxFreezeDays === 0) {
        return fail('Freeze requests are disabled for this branch.', 400);
      }

      const remainingDays = maxFreezeDays - membership.freezeDays;

      if (input.requestedDays > remainingDays) {
        return fail(
          `Only ${Math.max(0, remainingDays)} freeze days remain for this membership.`,
          400,
        );
      }

      const existingRequest = await MembershipFreezeRequest.findOne({
        membershipId: membership._id,
        status: FreezeRequestStatus.PENDING,
      }).session(session);

      if (existingRequest) {
        return fail('A pending freeze request already exists for this membership.', 409);
      }

      const [request] = await MembershipFreezeRequest.create(
        [
          {
            membershipId: membership._id,
            memberId: member._id,
            branchId: membership.branchId,
            requestedDays: input.requestedDays,
            reason,
            status: FreezeRequestStatus.PENDING,
          },
        ],
        { session },
      );

      await MembershipHistory.create(
        [
          {
            membershipId: membership._id,
            memberId: member._id,
            branchId: membership.branchId,
            action: MembershipHistoryAction.FREEZE_REQUESTED,
            previousStatus: membership.status,
            newStatus: membership.status,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes: reason,
            metadata: {
              freezeRequestId: request._id.toString(),
              requestedDays: input.requestedDays,
            },
          },
        ],
        { session },
      );

      return request._id;
    });

    if (!requestId) {
      return fail('Freeze request could not be created.', 500);
    }

    return populateFreezeRequest(
      MembershipFreezeRequest.findById(requestId),
    );
  } finally {
    await session.endSession();
  }
};

/**
 * Staff can view freeze requests from their authorized branch.
 */
export const getMembershipFreezeRequests = async (
  actor: FreezeActor,
  options: {
    status?: FreezeRequestStatus;
    page?: number;
    limit?: number;
  } = {},
) => {
  if (!isStaff(actor.role)) {
    return fail('You are not authorized to view freeze requests.', 403);
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));

  const filter: Record<string, unknown> = {};

  if (actor.role !== UserRole.SUPER_ADMIN) {
    if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
      return fail('A valid assigned branch is required.', 403);
    }

    filter.branchId = new mongoose.Types.ObjectId(actor.branchId);
  }

  if (options.status) {
    if (
      !Object.values(FreezeRequestStatus).includes(options.status)
    ) {
      return fail('Invalid freeze request status.', 400);
    }

    filter.status = options.status;
  }

  const [data, total] = await Promise.all([
    populateFreezeRequest(
      MembershipFreezeRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ).lean(),

    MembershipFreezeRequest.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Branch Admin / Reception / Super Admin approves or rejects a request.
 */
export const reviewMembershipFreezeRequest = async (
  input: ReviewFreezeInput,
  actor: FreezeActor,
) => {
  if (!isStaff(actor.role)) {
    return fail('You are not authorized to review freeze requests.', 403);
  }

  if (!mongoose.isValidObjectId(input.requestId)) {
    return fail('Invalid freeze request ID.', 400);
  }

  if (!['APPROVE', 'REJECT'].includes(input.decision)) {
    return fail('Decision must be APPROVE or REJECT.', 400);
  }

  const reviewNotes = input.reviewNotes?.trim();

  if (reviewNotes && reviewNotes.length > 500) {
    return fail('Review notes cannot exceed 500 characters.', 400);
  }

  const session = await mongoose.startSession();

  try {
    const reviewedRequestId = await session.withTransaction(async () => {
      const request = await MembershipFreezeRequest.findById(
        input.requestId,
      ).session(session);

      if (!request) {
        return fail('Freeze request not found.', 404);
      }

      validateStaffBranchAccess(request.branchId.toString(), actor);

      if (request.status !== FreezeRequestStatus.PENDING) {
        return fail('This freeze request has already been reviewed.', 409);
      }

      const membership = await Membership.findById(
        request.membershipId,
      ).session(session);

      if (!membership) {
        return fail('Membership not found.', 404);
      }

      // Verify that the freeze request belongs to this membership.
if (
  !membership.memberId.equals(request.memberId) ||
  !membership.branchId.equals(request.branchId)
) {
  return fail(
    'Freeze request does not match the associated membership.',
    400,
  );
}

      if (input.decision === 'REJECT') {
        request.status = FreezeRequestStatus.REJECTED;
        request.reviewedBy = new mongoose.Types.ObjectId(actor.userId);
        request.reviewedAt = new Date();
        request.reviewNotes = reviewNotes;
        await request.save({ session });

        await MembershipHistory.create(
          [
            {
              membershipId: membership._id,
              memberId: request.memberId,
              branchId: request.branchId,
              action: MembershipHistoryAction.FREEZE_REJECTED,
              previousStatus: membership.status,
              newStatus: membership.status,
              performedBy: new mongoose.Types.ObjectId(actor.userId),
              notes: reviewNotes || 'Freeze request rejected.',
              metadata: {
                freezeRequestId: request._id.toString(),
                requestedDays: request.requestedDays,
              },
            },
          ],
          { session },
        );

        return request._id;
      }

      if (membership.status !== MembershipStatus.ACTIVE) {
        return fail('Only active memberships can be frozen.', 400);
      }

      const settings = await BranchSettings.findOne({
        branchId: membership.branchId,
      }).session(session);

      const maxFreezeDays = settings?.maxFreezeDays ?? 30;

      if (
        !Number.isInteger(maxFreezeDays) ||
        maxFreezeDays < 0 ||
        maxFreezeDays > 30
      ) {
        return fail('Branch freeze settings are invalid.', 400);
      }

      if (membership.freezeDays + request.requestedDays > maxFreezeDays) {
        return fail(
          `This request exceeds the remaining freeze allowance of ${Math.max(
            0,
            maxFreezeDays - membership.freezeDays,
          )} days.`,
          400,
        );
      }

      const now = new Date();
      const scheduledUnfreezeAt = new Date(
        now.getTime() + request.requestedDays * DAY_IN_MS,
      );

      membership.status = MembershipStatus.FROZEN;
      membership.frozenAt = now;
      membership.freezeEndDate = scheduledUnfreezeAt;
      await membership.save({ session });

      request.status = FreezeRequestStatus.APPROVED;
      request.reviewedBy = new mongoose.Types.ObjectId(actor.userId);
      request.reviewedAt = now;
      request.reviewNotes = reviewNotes;
      await request.save({ session });

      await MembershipHistory.create(
        [
          {
            membershipId: membership._id,
            memberId: request.memberId,
            branchId: request.branchId,
            action: MembershipHistoryAction.FROZEN,
            previousStatus: MembershipStatus.ACTIVE,
            newStatus: MembershipStatus.FROZEN,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes: reviewNotes || 'Freeze request approved.',
            metadata: {
              freezeRequestId: request._id.toString(),
              approvedDays: request.requestedDays,
              frozenAt: now,
              scheduledUnfreezeAt,
            },
          },
        ],
        { session },
      );

      return request._id;
    });

    if (!reviewedRequestId) {
      return fail('Freeze request review failed.', 500);
    }

    return populateFreezeRequest(
      MembershipFreezeRequest.findById(reviewedRequestId),
    );
  } finally {
    await session.endSession();
  }
};

/**
 * Staff manually unfreezes a membership.
 * Actual frozen days are added to the cumulative allowance and membership end date.
 */
export const unfreezeMembership = async (
  membershipId: string,
  actor: FreezeActor,
) => {
  if (!isStaff(actor.role)) {
    return fail('You are not authorized to unfreeze memberships.', 403);
  }

  if (!mongoose.isValidObjectId(membershipId)) {
    return fail('Invalid membership ID.', 400);
  }

  const session = await mongoose.startSession();

  try {
    const resultId = await session.withTransaction(async () => {
      const membership = await Membership.findById(
        membershipId,
      ).session(session);

      if (!membership) {
        return fail('Membership not found.', 404);
      }

      validateStaffBranchAccess(membership.branchId.toString(), actor);

      if (membership.status !== MembershipStatus.FROZEN || !membership.frozenAt) {
        return fail('This membership is not currently frozen.', 400);
      }

      const approvedRequest = await MembershipFreezeRequest.findOne({
        membershipId: membership._id,
        status: FreezeRequestStatus.APPROVED,
      })
        .sort({ reviewedAt: -1 })
        .session(session);

      if (!approvedRequest) {
        return fail('Approved freeze request not found.', 404);
      }

      const now = new Date();

      const elapsedDays = Math.ceil(
        (now.getTime() - membership.frozenAt.getTime()) / DAY_IN_MS,
      );

      const actualFrozenDays = Math.min(
        approvedRequest.requestedDays,
        Math.max(1, elapsedDays),
      );

      membership.endDate = new Date(
        membership.endDate.getTime() + actualFrozenDays * DAY_IN_MS,
      );

      membership.freezeDays += actualFrozenDays;
      membership.status = MembershipStatus.ACTIVE;
      membership.frozenAt = undefined;
      membership.freezeEndDate = undefined;

      await membership.save({ session });

      await MembershipHistory.create(
        [
          {
            membershipId: membership._id,
            memberId: membership.memberId,
            branchId: membership.branchId,
            action: MembershipHistoryAction.UNFROZEN,
            previousStatus: MembershipStatus.FROZEN,
            newStatus: MembershipStatus.ACTIVE,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes: 'Membership manually unfrozen.',
            metadata: {
              freezeRequestId: approvedRequest._id.toString(),
              actualFrozenDays,
              previousEndDate: new Date(
                membership.endDate.getTime() -
                  actualFrozenDays * DAY_IN_MS,
              ),
              updatedEndDate: membership.endDate,
              unfrozenAt: now,
            },
          },
        ],
        { session },
      );

      return membership._id;
    });

    if (!resultId) {
      return fail('Membership could not be unfrozen.', 500);
    }

    return Membership.findById(resultId)
      .populate('memberId', 'memberId firstName lastName email mobile')
      .populate('planId', 'planName planType duration price ptIncluded')
      .populate('branchId', 'name code');
  } finally {
    await session.endSession();
  }
};
