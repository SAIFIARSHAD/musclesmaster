
import mongoose from 'mongoose';
import { User } from '../src/models/User.model';
import { Branch } from '../src/models/Branch.model';
import { UserRole } from '../src/constants/roles.enum';
import {
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  type UserActor,
} from '../src/services/user.service';
import { revokeAllUserSessions } from '../src/services/session.service';

jest.mock('../src/models/User.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock('../src/models/Branch.model', () => ({
  Branch: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/services/session.service', () => ({
  revokeAllUserSessions: jest.fn(),
}));

const mockUser = User as jest.Mocked<typeof User>;
const mockBranch = Branch as jest.Mocked<typeof Branch>;

const branchId = '507f1f77bcf86cd799439011';
const userId = new mongoose.Types.ObjectId();

const superAdmin: UserActor = {
  userId: new mongoose.Types.ObjectId().toString(),
  role: UserRole.SUPER_ADMIN,
};

function makeUser(overrides: Record<string, any> = {}) {
  return {
    _id: userId,
    name: 'Branch Admin',
    email: 'admin@example.com',
    password: 'Password123!',
    mobile: '9876543210',
    role: UserRole.BRANCH_ADMIN,
    branchId,
    isActive: true,
    save: jest.fn().mockResolvedValue(undefined),
    toObject() {
      return { ...this };
    },
    ...overrides,
  };
}

function makeQuery(result: any) {
  const query: any = {
    session: jest.fn().mockReturnThis(),
    then: (resolve: any, reject: any) =>
      Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

describe('User Service - Branch Admin management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
describe('updateUser - Branch Admin reassignment', () => {
  const newBranchId = '507f1f77bcf86cd799439013';

  function setupExistingAdmin() {
    const user = makeUser({ branchId });

    mockUser.findById.mockResolvedValue(user as never);

    return user;
  }

  it('successfully moves a Branch Admin and releases the old branch', async () => {
    const user = setupExistingAdmin();

    mockBranch.findById.mockResolvedValue({
      _id: newBranchId,
      isActive: true,
      managerId: null,
    } as never);

    mockBranch.findOneAndUpdate
      .mockResolvedValueOnce({
        _id: newBranchId,
        managerId: user._id,
        managerName: user.name,
      } as never)
      .mockResolvedValueOnce({
        _id: branchId,
        managerId: null,
        managerName: '',
      } as never);

    const result = await updateUser(
      String(user._id),
      { branchId: newBranchId },
      'superadmin@example.com',
      superAdmin,
    );

    expect(user.branchId).toBe(newBranchId);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(mockBranch.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(revokeAllUserSessions).toHaveBeenCalledWith(
      String(user._id),
    );
    expect(result.branchId).toBe(newBranchId);
  });

  it('does not release the old branch if the new branch is unavailable', async () => {
    const user = setupExistingAdmin();

    mockBranch.findById.mockResolvedValue({
      _id: newBranchId,
      isActive: true,
      managerId: null,
    } as never);

    mockBranch.findOneAndUpdate.mockResolvedValue(null as never);

    await expect(
      updateUser(
        String(user._id),
        { branchId: newBranchId },
        'superadmin@example.com',
        superAdmin,
      ),
    ).rejects.toMatchObject({
      message: 'Branch is inactive, unavailable, or already assigned',
      statusCode: 409,
    });

    expect(user.branchId).toBe(branchId);
    expect(mockBranch.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('attempts to release the new branch if saving the reassignment fails', async () => {
    const user = setupExistingAdmin();
    user.save.mockRejectedValue(new Error('User save failed'));

    mockBranch.findById.mockResolvedValue({
      _id: newBranchId,
      isActive: true,
      managerId: null,
    } as never);

    mockBranch.findOneAndUpdate
      .mockResolvedValueOnce({
        _id: newBranchId,
        managerId: user._id,
        managerName: user.name,
      } as never)
      .mockResolvedValueOnce({
        _id: newBranchId,
        managerId: null,
        managerName: '',
      } as never);

    await expect(
      updateUser(
        String(user._id),
        { branchId: newBranchId },
        'superadmin@example.com',
        superAdmin,
      ),
    ).rejects.toThrow('User save failed');

    expect(mockBranch.findOneAndUpdate).toHaveBeenCalledTimes(2);

    expect(mockBranch.findOneAndUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        _id: newBranchId,
        managerId: user._id,
      }),
      expect.objectContaining({
        $set: {
          managerId: null,
          managerName: '',
        },
      }),
      expect.objectContaining({
        new: true,
        runValidators: true,
      }),
    );

    expect(revokeAllUserSessions).not.toHaveBeenCalled();
  });
});

  
describe('updateUser', () => {
  it('attempts to release the new branch if saving a reassignment fails', async () => {
    const oldBranchId = branchId;
    const newBranchId = '507f1f77bcf86cd799439013';

    const user = makeUser({
      branchId: oldBranchId,
    });

    user.save.mockRejectedValue(new Error('User save failed'));

    mockUser.findById.mockResolvedValue(user as never);

    mockBranch.findById.mockResolvedValue({
      _id: newBranchId,
      isActive: true,
      managerId: null,
    } as never);

    // First call claims the new branch.
    // Second call attempts to release it after save fails.
    mockBranch.findOneAndUpdate
      .mockResolvedValueOnce({
        _id: newBranchId,
        managerId: user._id,
        managerName: user.name,
      } as never)
      .mockResolvedValueOnce({
        _id: newBranchId,
        managerId: null,
        managerName: '',
      } as never);

    await expect(
      updateUser(
        String(user._id),
        { branchId: newBranchId },
        'superadmin@example.com',
        superAdmin,
      ),
    ).rejects.toThrow('User save failed');

    expect(mockBranch.findOneAndUpdate).toHaveBeenCalledTimes(2);

    expect(mockBranch.findOneAndUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        _id: newBranchId,
        managerId: user._id,
      }),
      expect.objectContaining({
        $set: {
          managerId: null,
          managerName: '',
        },
      }),
      expect.objectContaining({
        new: true,
        runValidators: true,
      }),
    );
  });
});


it('attempts to restore the branch if saving the deactivated user fails', async () => {
  const user = makeUser();
  user.save.mockRejectedValue(new Error('User save failed'));

  mockUser.findById.mockResolvedValue(user as never);

  // First call: release the branch.
  // Second call: claim it again during rollback.
  mockBranch.findOneAndUpdate
    .mockResolvedValueOnce({
      _id: branchId,
      managerId: null,
    } as never)
    .mockResolvedValueOnce({
      _id: branchId,
      managerId: user._id,
      managerName: user.name,
    } as never);

  await expect(
    updateUserStatus(
      String(user._id),
      false,
      'superadmin@example.com',
      superAdmin,
    ),
  ).rejects.toThrow('User save failed');

  expect(mockBranch.findOneAndUpdate).toHaveBeenCalledTimes(2);

  // Verify the second operation attempts to reclaim the branch.
  expect(mockBranch.findOneAndUpdate).toHaveBeenLastCalledWith(
    expect.objectContaining({
      _id: branchId,
      isActive: true,
      managerId: null,
    }),
    expect.objectContaining({
      $set: expect.objectContaining({
        managerId: user._id,
        managerName: user.name,
      }),
    }),
    expect.objectContaining({
      new: true,
      runValidators: true,
    }),
  );

  expect(revokeAllUserSessions).not.toHaveBeenCalled();
});


  describe('createUser', () => {
    it('creates a Branch Admin and claims the branch', async () => {
      const createdUser = makeUser();

      mockUser.findOne.mockResolvedValue(null as never);
      mockBranch.findById.mockResolvedValue({
        _id: branchId,
        isActive: true,
        managerId: null,
      } as never);
      mockUser.create.mockResolvedValue(createdUser as never);
      mockBranch.findOneAndUpdate.mockResolvedValue({
        _id: branchId,
        managerId: userId,
        managerName: 'Branch Admin',
      } as never);

      const result = await createUser(
        {
          name: 'Branch Admin',
          email: ' ADMIN@example.com ',
          password: 'Password123!',
          mobile: '9876543210',
          role: UserRole.BRANCH_ADMIN,
          branchId,
        },
        'superadmin@example.com',
        superAdmin,
      );

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          role: UserRole.BRANCH_ADMIN,
          branchId,
        }),
      );

      expect(mockBranch.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: branchId,
          isActive: true,
          managerId: null,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            managerId: userId,
            managerName: 'Branch Admin',
          }),
        }),
        expect.objectContaining({
          new: true,
          runValidators: true,
        }),
      );

      expect(result).not.toHaveProperty('password');
    });

    it('rejects creation when the branch already has a Branch Admin user', async () => {
      mockUser.findOne.mockResolvedValue(null as never);
      mockBranch.findById.mockResolvedValue({
        _id: branchId,
        isActive: true,
        managerId: null,
      } as never);

      mockUser.findOne.mockResolvedValueOnce(null as never);
      mockUser.findOne.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
      } as never);

      await expect(
        createUser(
          {
            name: 'Another Admin',
            email: 'another@example.com',
            password: 'Password123!',
            mobile: '9876543211',
            role: UserRole.BRANCH_ADMIN,
            branchId,
          },
          'superadmin@example.com',
          superAdmin,
        ),
      ).rejects.toMatchObject({
        message: 'A Branch Admin is already assigned to this branch',
        statusCode: 409,
      });

      expect(mockUser.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUserStatus', () => {
    it('rejects reactivation when the Branch Admin has no branch', async () => {
      const user = makeUser({ branchId: undefined, isActive: false });

      mockUser.findById.mockResolvedValue(user as never);

      await expect(
        updateUserStatus(
          String(user._id),
          true,
          'superadmin@example.com',
          superAdmin,
        ),
      ).rejects.toMatchObject({
        message:
          'Assign an active branch to this Branch Admin before reactivating the account',
        statusCode: 400,
      });

      expect(user.save).not.toHaveBeenCalled();
    });

    it('releases the branch when deactivating a Branch Admin', async () => {
      const user = makeUser();

      mockUser.findById.mockResolvedValue(user as never);
      mockBranch.findOneAndUpdate.mockResolvedValue({
        _id: branchId,
        managerId: null,
      } as never);

      const result = await updateUserStatus(
        String(user._id),
        false,
        'superadmin@example.com',
        superAdmin,
      );

      expect(mockBranch.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: branchId,
          managerId: user._id,
        }),
        expect.objectContaining({
          $set: {
            managerId: null,
            managerName: '',
          },
        }),
        expect.objectContaining({
          new: true,
          runValidators: true,
        }),
      );

      expect(user.branchId).toBeUndefined();
      expect(user.isActive).toBe(false);
      expect(user.save).toHaveBeenCalled();
      expect(revokeAllUserSessions).toHaveBeenCalledWith(
        String(user._id),
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('releases the branch, revokes sessions and deletes the user in a transaction', async () => {
      const user = makeUser();
      const session = {} as mongoose.ClientSession;

      mockUser.findById.mockReturnValue(
        makeQuery(user) as never,
      );

      mockBranch.findOneAndUpdate.mockResolvedValue({
        _id: branchId,
        managerId: null,
      } as never);

      mockUser.findOneAndDelete.mockReturnValue(
        makeQuery(user) as never,
      );

      const transactionSpy = jest
        .spyOn(mongoose.connection, 'transaction')
        .mockImplementation(
          ((callback: (session: mongoose.ClientSession) => Promise<any>) =>
            callback(session)) as any,
        );

      try {
        const result = await deleteUser(
          String(user._id),
          'superadmin@example.com',
          superAdmin,
        );

        expect(transactionSpy).toHaveBeenCalled();
        expect(mockBranch.findOneAndUpdate).toHaveBeenCalled();
        expect(revokeAllUserSessions).toHaveBeenCalledWith(
          String(user._id),
          session,
        );
        expect(mockUser.findOneAndDelete).toHaveBeenCalled();
        expect(result).toEqual({
          id: String(user._id),
          message: 'User deleted successfully',
        });
      } finally {
        transactionSpy.mockRestore();
      }
    });
  });
});
