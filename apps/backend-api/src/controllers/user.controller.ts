import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserStatus,
  type UserActor,
} from '../services/user.service';
import { UserRole } from '../constants/roles.enum';
import { User } from '../models/User.model';

const getErrorStatus = (error: unknown, fallback = 500): number => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return fallback;
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
};

const getUserIdParam = (
  id: string | string[] | undefined,
): string | null => {
  if (typeof id !== 'string' || !id.trim()) {
    return null;
  }

  return id.trim();
};

const getActor = (req: AuthRequest): UserActor | null => {
  if (!req.user?.userId) {
    return null;
  }

  return {
    userId: req.user.userId,
    role: req.user.role as UserRole,
    branchId: req.user.branchId,
  };
};

const getCurrentAdminEmail = async (
  userId: string,
): Promise<string> => {
  const admin = await User.findById(userId).select('email');

  if (!admin) {
    throw Object.assign(
      new Error('Authenticated user not found'),
      { statusCode: 401 },
    );
  }

  return admin.email;
};

export const getUsersHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const users = await getUsers(actor);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Unable to fetch users'),
    });
  }
};

export const createUserHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const adminEmail = await getCurrentAdminEmail(actor.userId);

    const user = await createUser(
      {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        mobile: req.body.mobile,
        role: req.body.role as UserRole,
        branchId: req.body.branchId,
      },
      adminEmail,
      actor,
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Unable to create user'),
    });
  }
};

export const updateUserHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const userId = getUserIdParam(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'A valid user ID is required',
      });
    }

    const adminEmail = await getCurrentAdminEmail(actor.userId);

    const user = await updateUser(
      userId,
      {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        role: req.body.role as UserRole | undefined,
        branchId: req.body.branchId,
      },
      adminEmail,
      actor,
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Unable to update user'),
    });
  }
};

export const updateUserStatusHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const userId = getUserIdParam(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'A valid user ID is required',
      });
    }

    const adminEmail = await getCurrentAdminEmail(actor.userId);

    const user = await updateUserStatus(
      userId,
      req.body.isActive,
      adminEmail,
      actor,
    );

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Unable to update user status'),
    });
  }
};

export const deleteUserHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const userId = getUserIdParam(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'A valid user ID is required',
      });
    }

    const adminEmail = await getCurrentAdminEmail(actor.userId);

    await deleteUser(userId, adminEmail, actor);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Unable to delete user'),
    });
  }
};
