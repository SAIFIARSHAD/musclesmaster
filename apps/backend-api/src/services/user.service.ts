import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Branch } from '../models/Branch.model';
import { UserRole } from '../constants/roles.enum';
import { revokeAllUserSessions } from './session.service';

export interface UserActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  branchId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  mobile?: string;
  role?: UserRole;
  branchId?: string | null;
}

const BRANCH_ROLES: UserRole[] = [
  UserRole.RECEPTION,
  UserRole.TRAINER,
  UserRole.MEMBER,
];

const SAFE_USER_FIELDS = [
  '-password',
  '-passwordHash',
  '-resetOtp',
  '-resetOtpExpiry',
  '-resetVerifiedToken',
  '-resetVerifiedTokenExpiry',
].join(' ');

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

function isSuperAdmin(actor: UserActor): boolean {
  return actor.role === UserRole.SUPER_ADMIN;
}

function isBranchAdmin(actor: UserActor): boolean {
  return actor.role === UserRole.BRANCH_ADMIN;
}

function requireBranchId(value: string | null | undefined): string {
  if (!value || !mongoose.isValidObjectId(value)) {
    return fail('A valid branch ID is required', 400);
  }

  return value;
}

function assertCanManageRole(actor: UserActor, targetRole: UserRole): void {
  if (isSuperAdmin(actor)) {
    if (targetRole !== UserRole.BRANCH_ADMIN) {
      return fail('Super Admin can manage Branch Admin accounts only', 403);
    }

    return;
  }

  if (isBranchAdmin(actor)) {
    if (!BRANCH_ROLES.includes(targetRole)) {
      return fail(
        'Branch Admin can manage Reception, Trainer and Member accounts only',
        403,
      );
    }

    return;
  }

  return fail('You are not allowed to manage users', 403);
}

async function getActiveBranch(branchIdValue: string) {
  const branchId = requireBranchId(branchIdValue);
  const branch = await Branch.findById(branchId);

  if (!branch) {
    return fail('Branch not found', 404);
  }

  if (!branch.isActive) {
    return fail('This branch is inactive', 400);
  }

  return branch;
}


async function claimBranchForManager(
  branchId: string,
  managerId: mongoose.Types.ObjectId,
  managerName: string,
) {
  const branch = await Branch.findOneAndUpdate(
    {
      _id: branchId,
      isActive: true,
      managerId: null,
    },
    {
      $set: {
        managerId,
        managerName,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!branch) {
    return fail(
      'Branch is inactive, unavailable, or already assigned',
      409,
    );
  }

  return branch;
}


async function releaseBranchForManager(
  branchId: string | undefined,
  managerId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
) {
  if (!branchId) return;

  await Branch.findOneAndUpdate(
    {
      _id: branchId,
      managerId,
    },
    {
      $set: {
        managerId: null,
        managerName: '',
      },
    },
    {
      new: true,
      runValidators: true,
      ...(session ? { session } : {}),
    },
  );
}


function assertTargetInActorScope(
  actor: UserActor,
  target: {
    _id: mongoose.Types.ObjectId | string;
    role: UserRole;
    branchId?: string | null;
  },
): void {
  if (String(target._id) === String(actor.userId)) {
    return fail('You cannot manage your own account through this endpoint', 403);
  }

  if (isSuperAdmin(actor)) {
    if (target.role !== UserRole.BRANCH_ADMIN) {
      return fail('Super Admin can manage Branch Admin accounts only', 403);
    }

    return;
  }

  if (isBranchAdmin(actor)) {
    const actorBranchId = requireBranchId(actor.branchId);

    if (!BRANCH_ROLES.includes(target.role)) {
      return fail('You cannot manage this user role', 403);
    }

    if (String(target.branchId ?? '') !== actorBranchId) {
      return fail('You can manage users from your branch only', 403);
    }

    return;
  }

  return fail('You are not allowed to manage users', 403);
}

async function getUserForManagement(
  userId: string,
  actor: UserActor,
) {
  if (!mongoose.isValidObjectId(userId)) {
    return fail('Invalid user ID', 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    return fail('User not found', 404);
  }

  assertTargetInActorScope(actor, user);

  return user;
}

function getSafeUser(user: any) {
  if (!user) {
    return user;
  }

  const result =
    typeof user.toObject === 'function'
      ? user.toObject()
      : { ...user };

  delete result.password;
  delete result.passwordHash;
  delete result.resetOtp;
  delete result.resetOtpExpiry;
  delete result.resetVerifiedToken;
  delete result.resetVerifiedTokenExpiry;

  return result;
}

/**
 * List users visible to the current actor.
 */
export async function getUsers(actor: UserActor) {
  if (isSuperAdmin(actor)) {
    const users = await User.find({
      role: UserRole.BRANCH_ADMIN,
    })
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return users;
  }

  if (isBranchAdmin(actor)) {
    const branchId = requireBranchId(actor.branchId);

    const users = await User.find({
      branchId,
      role: { $in: BRANCH_ROLES },
    })
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return users;
  }

  return fail('You are not allowed to view users', 403);
}



/**
 * Create a user according to the actor's role and branch scope.
 * Branch Admin creation also claims the branch.
 */
export async function createUser(
  data: CreateUserInput,
  _actorEmail: string,
  actor: UserActor,
) {
  assertCanManageRole(actor, data.role);

  const email = data.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return fail('A user with this email already exists', 409);
  }

  let branchId: string;

  if (isSuperAdmin(actor)) {
    branchId = requireBranchId(data.branchId);
    await getActiveBranch(branchId);
  } else if (isBranchAdmin(actor)) {
    branchId = requireBranchId(actor.branchId);
    await getActiveBranch(branchId);

    if (data.branchId && String(data.branchId) !== branchId) {
      return fail('You can create users in your own branch only', 403);
    }
  } else {
    return fail('You are not allowed to create users', 403);
  }

  // Branch Admin accounts are created only for an unassigned branch.
  if (data.role === UserRole.BRANCH_ADMIN) {
    const existingBranchAdmin = await User.findOne({
      role: UserRole.BRANCH_ADMIN,
      branchId,
    });

    if (existingBranchAdmin) {
      return fail(
        'A Branch Admin is already assigned to this branch',
        409,
      );
    }

    const branch = await Branch.findById(branchId);

    if (!branch || !branch.isActive) {
      return fail('Branch not found or inactive', 400);
    }

    if (branch.managerId) {
      return fail(
        'This branch already has a Branch Admin',
        409,
      );
    }

    const user = await User.create({
      name: data.name.trim(),
      email,
      password: data.password,
      mobile: data.mobile.trim(),
      role: data.role,
      branchId,
      isActive: true,
    });

    try {
      await claimBranchForManager(
        branchId,
        user._id,
        user.name,
      );
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }

    return getSafeUser(user);
  }

  // Preserve the existing flow for Reception, Trainer and Member.
  const user = await User.create({
    name: data.name.trim(),
    email,
    password: data.password,
    mobile: data.mobile.trim(),
    role: data.role,
    branchId,
    isActive: true,
  });

  return getSafeUser(user);
}


/**
 * Update user details while preserving the actor's scope.
 */

export async function updateUser(
  userId: string,
  data: UpdateUserInput,
  _actorEmail: string,
  actor: UserActor,
) {
  const user = await getUserForManagement(userId, actor);

  const previousRole = user.role;
  const previousBranchId = user.branchId
    ? String(user.branchId)
    : '';

  const nextRole = data.role ?? user.role;

  assertCanManageRole(actor, nextRole);

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return fail('A user with this email already exists', 409);
    }

    user.email = email;
  }

  if (data.name !== undefined) {
    user.name = data.name.trim();
  }

  if (data.mobile !== undefined) {
    user.mobile = data.mobile.trim();
  }

  user.role = nextRole;

  if (isBranchAdmin(actor)) {
    const actorBranchId = requireBranchId(actor.branchId);

    if (
      data.branchId !== undefined &&
      data.branchId !== null &&
      String(data.branchId) !== actorBranchId
    ) {
      return fail('You cannot move a user to another branch', 403);
    }

    if (data.branchId === null) {
      return fail('A branch cannot be removed from this user', 400);
    }

    user.branchId = actorBranchId;
  } else if (isSuperAdmin(actor)) {
    if (nextRole === UserRole.BRANCH_ADMIN) {
      const requestedBranchId =
        data.branchId !== undefined && data.branchId !== null
          ? requireBranchId(data.branchId)
          : previousBranchId;

      if (!requestedBranchId) {
        return fail(
          'A branch must be assigned to a Branch Admin',
          400,
        );
      }

      await getActiveBranch(requestedBranchId);

      const isChangingBranch =
        previousRole === UserRole.BRANCH_ADMIN &&
        previousBranchId !== requestedBranchId;

     
      if (isChangingBranch) {
        // Claim the new branch first. If it is unavailable,
        // the old assignment remains unchanged.
        await claimBranchForManager(
          requestedBranchId,
          user._id,
          user.name,
        );

        try {
          user.branchId = requestedBranchId;
          await user.save();
        } catch (error) {
          // Roll back the new branch claim if saving the user fails.
          await releaseBranchForManager(
            requestedBranchId,
            user._id,
          );
          throw error;
        }

        // Release the old branch only after the new assignment succeeds.
        await releaseBranchForManager(
          previousBranchId,
          user._id,
        );
      } else if (previousRole !== UserRole.BRANCH_ADMIN) {
        // Promoting another role to Branch Admin requires
        // a branch that is not already assigned.
        await claimBranchForManager(
          requestedBranchId,
          user._id,
          user.name,
        );

        user.branchId = requestedBranchId;

        try {
          await user.save();
        } catch (error) {
          await releaseBranchForManager(
            requestedBranchId,
            user._id,
          );
          throw error;
        }
      } else {
        // Same branch: keep the manager name in sync.
        const branch = await Branch.findOneAndUpdate(
          {
            _id: requestedBranchId,
            isActive: true,
            managerId: user._id,
          },
          {
            $set: { managerName: user.name },
          },
          { new: true, runValidators: true },
        );

        if (!branch) {
          return fail(
            'Branch assignment is inconsistent. Please verify the branch assignment before updating this user.',
            409,
          );
        }

        user.branchId = requestedBranchId;
      }
    } else {
      // A Branch Admin changing to another role must release
      // the branch they previously managed.
      if (previousRole === UserRole.BRANCH_ADMIN) {
        await releaseBranchForManager(
          previousBranchId,
          user._id,
        );
      }

      if (data.branchId !== undefined && data.branchId !== null) {
        const newBranchId = requireBranchId(data.branchId);
        await getActiveBranch(newBranchId);
        user.branchId = newBranchId;
      } else {
        user.branchId = previousBranchId || undefined;
      }

      await user.save();
    }
  } else {
    return fail('You are not allowed to update users', 403);
  }

  // Save ordinary profile updates and same-branch Branch Admin updates.
  // Branch reassignment/promotion paths above have already saved the user.
  const branchAssignmentHandled =
    isSuperAdmin(actor) &&
    (
      nextRole === UserRole.BRANCH_ADMIN &&
      (
        previousRole !== UserRole.BRANCH_ADMIN ||
        previousBranchId !== String(user.branchId ?? '')
      )
    );

  if (!branchAssignmentHandled) {
    await user.save();
  }

  const currentBranchId = user.branchId
    ? String(user.branchId)
    : '';

  if (
    previousRole !== user.role ||
    previousBranchId !== currentBranchId
  ) {
    await revokeAllUserSessions(String(user._id));
  }

  return getSafeUser(user);
}


/**
 * Activate or deactivate a user.
 */


export async function updateUserStatus(
  userId: string,
  isActive: boolean,
  _actorEmail: string,
  actor: UserActor,
) {
  const user = await getUserForManagement(userId, actor);

  const isBranchManager = user.role === UserRole.BRANCH_ADMIN;
  const branchId = user.branchId
    ? String(user.branchId)
    : '';

  // A Branch Admin can only be reactivated with a valid assignment.
  if (isActive && isBranchManager) {
    if (!branchId) {
      return fail(
        'Assign an active branch to this Branch Admin before reactivating the account',
        400,
      );
    }

    const branch = await Branch.findOne({
      _id: branchId,
      isActive: true,
      managerId: user._id,
    });

    if (!branch) {
      return fail(
        'This Branch Admin has no valid branch assignment. Assign an available branch before reactivating the account.',
        409,
      );
    }
  }

  // If status is unchanged, avoid unnecessary writes.
  if (user.isActive === isActive) {
    return getSafeUser(user);
  }

  if (!isActive && isBranchManager) {
    // Release only the branch currently assigned to this manager.
    await releaseBranchForManager(branchId, user._id);

    // Clear the assignment from the user document.
    user.branchId = undefined;
  }

  user.isActive = isActive;

  try {
    await user.save();
  } catch (error) {
    // If saving failed after releasing the branch, attempt to restore
    // the original branch assignment before propagating the error.
    if (!isActive && isBranchManager && branchId) {
      try {
        await claimBranchForManager(
          branchId,
          user._id,
          user.name,
        );
      } catch (rollbackError) {
        // Preserve the original save error; rollback failure needs
        // operational logging and reconciliation.
      }
    }

    throw error;
  }

  if (!isActive) {
    await revokeAllUserSessions(String(user._id));
  }

  return getSafeUser(user);
}



/**
 * Delete a user account.
 */


export async function deleteUser(
  userId: string,
  _actorEmail: string,
  actor: UserActor,
) {
  if (!mongoose.isValidObjectId(userId)) {
    return fail('Invalid user ID', 400);
  }

  return mongoose.connection.transaction(async (session) => {
    const user = await User.findById(userId).session(session);

    if (!user) {
      return fail('User not found', 404);
    }

    assertTargetInActorScope(actor, user);

    const isBranchManager = user.role === UserRole.BRANCH_ADMIN;
    const branchId = user.branchId
      ? String(user.branchId)
      : '';

    // Release the branch within the same transaction.
    if (isBranchManager && branchId) {
      await releaseBranchForManager(
        branchId,
        user._id,
        session,
      );
    }

    // Revoke sessions in the same transaction.
    await revokeAllUserSessions(
      String(user._id),
      session,
    );

    // Delete the user only after the preceding operations succeed.
    const deletedUser = await User.findOneAndDelete({
      _id: user._id,
    }).session(session);

    if (!deletedUser) {
      return fail(
        'User could not be deleted. Please retry.',
        409,
      );
    }

    return {
      id: String(user._id),
      message: 'User deleted successfully',
    };
  });
}


