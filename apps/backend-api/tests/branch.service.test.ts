
import mongoose from 'mongoose';
import { Branch } from '../src/models/Branch.model';
import { User } from '../src/models/User.model';
import { UserRole } from '../src/constants/roles.enum';

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  updateBranchStatus,
} from '../src/services/branch.service';

jest.mock('../src/models/Branch.model', () => ({
  Branch: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
}));


jest.mock('../src/models/User.model', () => ({
  User: {
    findById: jest.fn(),
    exists: jest.fn().mockResolvedValue(null),
  },
}));


const mockBranch = Branch as jest.Mocked<typeof Branch>;
const mockUser = User as jest.Mocked<typeof User>;

const branchId = '507f1f77bcf86cd799439011';
const managerId = '507f1f77bcf86cd799439012';

function validBranchData() {
  return {
    name: '  Noida Branch  ',
    code: ' noida01 ',
    address: ' Sector 63 ',
    city: ' Noida ',
    state: ' Uttar Pradesh ',
    phone: '9876543210',
    email: ' BRANCH@EXAMPLE.COM ',
    managerName: ' Branch Manager ',
    gstNumber: '09AAACB2894G1Z5',
  };
}


function queryChain(result: unknown) {
  const chain = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(result),
  };

  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
}


describe('Branch Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBranch', () => {
    it('normalizes branch data before saving', async () => {
      const data = validBranchData();

      mockBranch.create.mockResolvedValue({ _id: branchId } as never);

      await createBranch(data);

      expect(mockBranch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Noida Branch',
          code: 'NOIDA01',
          address: 'Sector 63',
          city: 'Noida',
          state: 'Uttar Pradesh',
          email: 'branch@example.com',
          managerName: 'Branch Manager',
          gstNumber: '09AAACB2894G1Z5',
        }),
      );
    });

    it('rejects an invalid GST number', async () => {
      await expect(
        createBranch({
          name: 'Noida Branch',
          code: 'NOIDA01',
          gstNumber: 'INVALID-GST',
        }),
      ).rejects.toMatchObject({
        message: 'Invalid GST number format',
        statusCode: 400,
      });

      expect(mockBranch.create).not.toHaveBeenCalled();
    });

    it('returns a conflict for a duplicate branch code', async () => {
      mockBranch.create.mockRejectedValue({
        code: 11000,
      });

      await expect(
        createBranch({
          name: 'Noida Branch',
          code: 'NOIDA01',
        }),
      ).rejects.toMatchObject({
        message: 'A branch with this code already exists',
        statusCode: 409,
      });
    });
  });

  describe('getBranches', () => {
    it('applies pagination, search and active status filters', async () => {
      const rows = [{ _id: branchId, name: 'Noida Branch' }];
      const chain = queryChain(rows);

      mockBranch.find.mockReturnValue(chain as never);
      mockBranch.countDocuments.mockResolvedValue(1 as never);

      const result = await getBranches({
        page: 2,
        limit: 5,
        search: 'Noida',
        status: 'active',
      });

      expect(mockBranch.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          $or: expect.any(Array),
        }),
      );

      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(chain.skip).toHaveBeenCalledWith(5);
      expect(chain.limit).toHaveBeenCalledWith(5);

      expect(result).toMatchObject({
        data: rows,
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('uses default pagination and returns inactive branches when requested', async () => {
      const rows = [{ _id: branchId, isActive: false }];
      const chain = queryChain(rows);

      mockBranch.find.mockReturnValue(chain as never);
      mockBranch.countDocuments.mockResolvedValue(0 as never);

      const result = await getBranches({ status: 'inactive' });

      expect(mockBranch.find).toHaveBeenCalledWith({
        isActive: false,
      });
      expect(chain.skip).toHaveBeenCalledWith(0);
      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it('escapes regex characters in search input', async () => {
      const chain = queryChain([]);

      mockBranch.find.mockReturnValue(chain as never);
      mockBranch.countDocuments.mockResolvedValue(0 as never);

      await getBranches({ search: 'Noida.*' });

      const filter = mockBranch.find.mock.calls[0][0] as unknown as {
  $or: Array<Record<string, RegExp>>;
};

      expect(filter.$or[0].name.source).toBe('Noida\\.\\*');
    });
  });

  describe('getBranchById', () => {
    it('rejects an invalid branch ID', async () => {
      await expect(getBranchById('invalid-id')).rejects.toMatchObject({
        message: 'Invalid branch ID',
        statusCode: 400,
      });

      expect(mockBranch.findById).not.toHaveBeenCalled();
    });

    it('returns a branch when found', async () => {
      const branch = { _id: branchId, name: 'Noida Branch' };

      mockBranch.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(branch),
      } as never);

      await expect(getBranchById(branchId)).resolves.toEqual(branch);
    });

    it('returns not found when branch does not exist', async () => {
      mockBranch.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as never);

      await expect(getBranchById(branchId)).rejects.toMatchObject({
        message: 'Branch not found',
        statusCode: 404,
      });
    });
  });

  describe('updateBranch', () => {
    it('rejects an invalid branch ID', async () => {
      await expect(
        updateBranch('invalid-id', { city: 'Meerut' }),
      ).rejects.toMatchObject({
        message: 'Invalid branch ID',
        statusCode: 400,
      });
    });

    it('updates a branch with normalized values', async () => {
      const current = { _id: branchId };
      const updated = { _id: branchId, city: 'Meerut' };

      mockBranch.findById.mockResolvedValue(current as never);
      mockBranch.findByIdAndUpdate.mockResolvedValue(updated as never);

      await updateBranch(branchId, {
        city: ' Meerut ',
        email: ' TEST@EXAMPLE.COM ',
      });

      expect(mockBranch.findByIdAndUpdate).toHaveBeenCalledWith(
        branchId,
        {
          $set: {
            city: 'Meerut',
            email: 'test@example.com',
          },
        },
        { new: true, runValidators: true },
      );
    });

    it('validates the manager role and assignment', async () => {
      mockBranch.findById.mockResolvedValue({ _id: branchId } as never);
      mockUser.findById.mockResolvedValue({
        _id: managerId,
        role: UserRole.TRAINER,
        isActive: true,
        branchId: new mongoose.Types.ObjectId(branchId),
      } as never);

     await expect(
  updateBranch(branchId, { managerId }),
).rejects.toMatchObject({
  message: 'Branch manager assignment must be managed through User Management',
  statusCode: 400,
});

      expect(mockBranch.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects a manager assigned to another branch', async () => {
      mockBranch.findById.mockResolvedValue({ _id: branchId } as never);
      mockUser.findById.mockResolvedValue({
        _id: managerId,
        role: UserRole.BRANCH_ADMIN,
        isActive: true,
        branchId: new mongoose.Types.ObjectId(branchId),
        name: 'Branch Admin',
      } as never);

      mockBranch.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
      } as never);

     await expect(
  updateBranch(branchId, { managerId }),
).rejects.toMatchObject({
  message: 'Branch manager assignment must be managed through User Management',
  statusCode: 400,
});
    });
  });

  describe('updateBranchStatus', () => {
    it('rejects an invalid branch ID', async () => {
      await expect(
        updateBranchStatus('invalid-id', false),
      ).rejects.toMatchObject({
        message: 'Invalid branch ID',
        statusCode: 400,
      });
    });

    
it('deactivates a branch', async () => {
  const branch = {
    _id: branchId,
    isActive: true,
    managerId: null,
    save: jest.fn().mockImplementation(function (this: any) {
      this.isActive = false;
      return Promise.resolve(this);
    }),
  };

  mockBranch.findById.mockResolvedValue(branch as never);

  await expect(
    updateBranchStatus(branchId, false),
  ).resolves.toEqual(branch);

  expect(branch.save).toHaveBeenCalled();
  expect(branch.isActive).toBe(false);
});


    
it('returns not found for a missing branch', async () => {
  mockBranch.findById.mockResolvedValue(null as never);

  await expect(
    updateBranchStatus(branchId, false),
  ).rejects.toMatchObject({
    message: 'Branch not found',
    statusCode: 404,
  });
});

  });
});
