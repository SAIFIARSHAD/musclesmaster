import { User } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { UserRole } from '../constants/roles.enum';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  branchId?: string;
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  mobile?: string;
  role?: UserRole;
  branchId?: string | null;
};

const userSelectFields =
  '-password -resetOtp -resetOtpExpiry -resetVerifiedToken -resetVerifiedTokenExpiry';

const toSafeUser = (user: any) => {
  const object = user.toObject ? user.toObject() : user;
  delete object.password;
  delete object.resetOtp;
  delete object.resetOtpExpiry;
  delete object.resetVerifiedToken;
  delete object.resetVerifiedTokenExpiry;
  return object;
};

const requiresBranch = (role: UserRole) => role !== UserRole.SUPER_ADMIN;

export const getUsers = async () => {
  return User.find().select(userSelectFields).sort({ createdAt: -1 });
};

export const getUserById = async (userId: string) => {
  return User.findById(userId).select(userSelectFields);
};

export const createUser = async (
  data: CreateUserInput,
  performedByEmail: string
) => {
  const email = data.email.toLowerCase().trim();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw Object.assign(new Error('An account already exists with this email'), {
      statusCode: 409,
    });
  }

  const user = await User.create({
    name: data.name.trim(),
    email,
    password: data.password,
    mobile: data.mobile.trim(),
    role: data.role,
    branchId: requiresBranch(data.role) ? data.branchId?.trim() : undefined,
    isActive: true,
  });

  await AuditLog.create({
    email: performedByEmail,
    action: 'USER_CREATE',
    status: 'SUCCESS',
    reason: `Created user: ${user.email} (${user.role})`,
  });

  return toSafeUser(user);
};

export const updateUser = async (
  userId: string,
  data: UpdateUserInput,
  performedByEmail: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw Object.assign(new Error('An account already exists with this email'), {
        statusCode: 409,
      });
    }

    user.email = email;
  }

  if (data.name !== undefined) {
    user.name = data.name.trim();
  }

  if (data.mobile !== undefined) {
    user.mobile = data.mobile.trim();
  }

  const finalRole = data.role ?? user.role;
  const finalBranchId =
    data.branchId !== undefined ? data.branchId : user.branchId;

  if (requiresBranch(finalRole) && !finalBranchId) {
    throw Object.assign(
      new Error('Branch mapping is required for non-Super-Admin users'),
      { statusCode: 400 }
    );
  }

  user.role = finalRole;

  if (finalRole === UserRole.SUPER_ADMIN) {
    user.branchId = undefined;
  } else {
    user.branchId = String(finalBranchId).trim();
  }

  await user.save();

  await AuditLog.create({
    email: performedByEmail,
    action: 'USER_UPDATE',
    status: 'SUCCESS',
    reason: `Updated user: ${user.email} (${user.role})`,
  });

  return toSafeUser(user);
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean,
  currentUserId: string,
  performedByEmail: string
) => {
  if (userId === currentUserId) {
    throw Object.assign(
      new Error('You cannot change the active status of your own account'),
      { statusCode: 400 }
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  user.isActive = isActive;
  await user.save();

  await AuditLog.create({
    email: performedByEmail,
    action: 'USER_STATUS_UPDATE',
    status: 'SUCCESS',
    reason: `${isActive ? 'Activated' : 'Deactivated'} user: ${user.email}`,
  });

  return toSafeUser(user);
};

export const deleteUser = async (
  userId: string,
  currentUserId: string,
  performedByEmail: string
) => {
  if (userId === currentUserId) {
    throw Object.assign(new Error('You cannot delete your own account'), {
      statusCode: 400,
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  await User.findByIdAndDelete(userId);

  await AuditLog.create({
    email: performedByEmail,
    action: 'USER_DELETE',
    status: 'SUCCESS',
    reason: `Deleted user: ${user.email} (${user.role})`,
  });

  return { id: userId };
};