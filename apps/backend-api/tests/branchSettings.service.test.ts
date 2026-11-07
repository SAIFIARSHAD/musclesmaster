import { Branch } from '../src/models/Branch.model';
import { BranchSettings } from '../src/models/BranchSettings.model';
import {
  getBranchSettings,
  updateBranchSettings,
} from '../src/services/branchSettings.service';

jest.mock('../src/models/Branch.model', () => ({
  Branch: {
    findById: jest.fn(),
  },
}));

jest.mock('../src/models/BranchSettings.model', () => ({
  BranchSettings: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mockBranch = Branch as jest.Mocked<typeof Branch>;
const mockSettings = BranchSettings as jest.Mocked<
  typeof BranchSettings
>;

const branchId = '507f1f77bcf86cd799439011';

describe('Branch Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBranchSettings', () => {
    it('rejects an invalid branch ID', async () => {
      await expect(
        getBranchSettings('invalid-id'),
      ).rejects.toMatchObject({
        message: 'Invalid branch ID',
        statusCode: 400,
      });

      expect(mockBranch.findById).not.toHaveBeenCalled();
    });

    it('returns not found when the branch does not exist', async () => {
      mockBranch.findById.mockResolvedValue(null as never);

      await expect(
        getBranchSettings(branchId),
      ).rejects.toMatchObject({
        message: 'Branch not found',
        statusCode: 404,
      });
    });

    it('returns existing settings', async () => {
      const branch = { _id: branchId };
      const settings = { branchId, timezone: 'Asia/Kolkata' };

      mockBranch.findById.mockResolvedValue(branch as never);
      mockSettings.findOne.mockResolvedValue(settings as never);

      await expect(
        getBranchSettings(branchId),
      ).resolves.toEqual(settings);

      expect(mockSettings.create).not.toHaveBeenCalled();
    });

    it('creates default settings when none exist', async () => {
      const branch = { _id: branchId };
      const settings = { branchId, timezone: 'Asia/Kolkata' };

      mockBranch.findById.mockResolvedValue(branch as never);
      mockSettings.findOne.mockResolvedValue(null as never);
      mockSettings.create.mockResolvedValue(settings as never);

      await expect(
        getBranchSettings(branchId),
      ).resolves.toEqual(settings);

      expect(mockSettings.create).toHaveBeenCalledWith({
        branchId,
      });
    });
  });

  describe('updateBranchSettings', () => {
    it('rejects an invalid branch ID', async () => {
      await expect(
        updateBranchSettings('invalid-id', {
          timezone: 'Asia/Kolkata',
        }),
      ).rejects.toMatchObject({
        message: 'Invalid branch ID',
        statusCode: 400,
      });

      expect(mockBranch.findById).not.toHaveBeenCalled();
    });

    it('returns not found when the branch does not exist', async () => {
      mockBranch.findById.mockResolvedValue(null as never);

      await expect(
        updateBranchSettings(branchId, {
          timezone: 'Asia/Kolkata',
        }),
      ).rejects.toMatchObject({
        message: 'Branch not found',
        statusCode: 404,
      });
    });

    it('updates settings using an upsert', async () => {
      const branch = { _id: branchId };
      const settings = {
        branchId,
        timezone: 'Asia/Kolkata',
        currency: 'INR',
      };

      mockBranch.findById.mockResolvedValue(branch as never);
      mockSettings.findOneAndUpdate.mockResolvedValue(
        settings as never,
      );

      await expect(
        updateBranchSettings(branchId, {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        }),
      ).resolves.toEqual(settings);

      expect(mockSettings.findOneAndUpdate).toHaveBeenCalledWith(
        { branchId },
        {
          $set: {
            timezone: 'Asia/Kolkata',
            currency: 'INR',
          },
          $setOnInsert: { branchId },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );
    });
  });
});
