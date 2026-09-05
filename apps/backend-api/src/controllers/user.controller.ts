import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserStatus,
} from '../services/user.service';
import { UserRole } from '../constants/roles.enum';
import { User } from '../models/User.model';

const getErrorStatus = (error: any, fallback = 400) =>
  error?.statusCode || fallback;

const getUserIdParam = (id: string | string[]): string | null => {
  if (typeof id !== 'string' || !id.trim()) {
    return null;
  }

  return id;
};

const getCurrentAdminEmail = async (userId: string) => {
  const admin = await User.findById(userId).select('email');

  if (!admin) {
    throw Object.assign(new Error('Authenticated user not found'), {
      statusCode: 401,
    });
  }

  return admin.email;
};

export const getUsersHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const users = await getUsers();

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch users',
    });
  }
};

export const createUserHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const adminEmail = await getCurrentAdminEmail(req.user.userId);

    const user = await createUser(
      {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        mobile: req.body.mobile,
        role: req.body.role as UserRole,
        branchId: req.body.branchId,
      },
      adminEmail
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || 'Unable to create user',
    });
  }
};

export const updateUserHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
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

    const adminEmail = await getCurrentAdminEmail(req.user.userId);

    const user = await updateUser(
      userId,
      {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        role: req.body.role as UserRole | undefined,
        branchId: req.body.branchId,
      },
      adminEmail
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || 'Unable to update user',
    });
  }
};

export const updateUserStatusHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
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

    const adminEmail = await getCurrentAdminEmail(req.user.userId);

    const user = await updateUserStatus(
      userId,
      req.body.isActive,
      req.user.userId,
      adminEmail
    );

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || 'Unable to update user status',
    });
  }
};

export const deleteUserHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
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

    const adminEmail = await getCurrentAdminEmail(req.user.userId);

    await deleteUser(userId, req.user.userId, adminEmail);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || 'Unable to delete user',
    });
  }
};