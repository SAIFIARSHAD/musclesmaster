import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/roles.enum';

const validRoles = Object.values(UserRole);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const requiresBranch = (role: UserRole) => role !== UserRole.SUPER_ADMIN;

export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password, mobile, role, branchId } = req.body;

  if (!isNonEmptyString(name)) {
    return res.status(400).json({
      success: false,
      message: 'Name is required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email is required',
    });
  }

  if (!isNonEmptyString(password) || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  if (!isNonEmptyString(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  if (!isNonEmptyString(role) || !validRoles.includes(role as UserRole)) {
    return res.status(400).json({
      success: false,
      message: 'A valid user role is required',
    });
  }

  if (requiresBranch(role as UserRole) && !isNonEmptyString(branchId)) {
    return res.status(400).json({
      success: false,
      message: 'Branch mapping is required for non-Super-Admin users',
    });
  }

  next();
};

export const validateUpdateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, mobile, role, branchId } = req.body;

  if (
    name === undefined &&
    email === undefined &&
    mobile === undefined &&
    role === undefined &&
    branchId === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'At least one user field is required for update',
    });
  }

  if (name !== undefined && !isNonEmptyString(name)) {
    return res.status(400).json({
      success: false,
      message: 'Name cannot be empty',
    });
  }

  if (email !== undefined && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (mobile !== undefined && !isNonEmptyString(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number cannot be empty',
    });
  }

  if (
    role !== undefined &&
    (!isNonEmptyString(role) || !validRoles.includes(role as UserRole))
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid user role',
    });
  }

  if (branchId !== undefined && branchId !== null && !isNonEmptyString(branchId)) {
    return res.status(400).json({
      success: false,
      message: 'Branch ID cannot be empty',
    });
  }

  next();
};

export const validateUserStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be true or false',
    });
  }

  next();
};