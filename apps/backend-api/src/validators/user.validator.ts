
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserRole } from '../constants/roles.enum';

const validRoles = Object.values(UserRole);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidRole = (value: unknown): value is UserRole =>
  typeof value === 'string' &&
  validRoles.includes(value as UserRole);

const isValidBranchId = (value: unknown): value is string =>
  typeof value === 'string' &&
  mongoose.isValidObjectId(value.trim());

const sendValidationError = (
  res: Response,
  message: string,
) =>
  res.status(400).json({
    success: false,
    message,
  });

export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password, mobile, role, branchId } = req.body;

  if (!isNonEmptyString(name)) {
    return sendValidationError(res, 'Name is required');
  }

  if (!isValidEmail(email)) {
    return sendValidationError(res, 'A valid email is required');
  }

  if (!isNonEmptyString(password) || password.length < 8) {
    return sendValidationError(
      res,
      'Password must be at least 8 characters',
    );
  }

  if (!isNonEmptyString(mobile)) {
    return sendValidationError(res, 'Mobile number is required');
  }

  if (!isValidRole(role)) {
    return sendValidationError(res, 'A valid user role is required');
  }

  // A branch assignment is mandatory for every role that can be
  // created through these user-management endpoints.
  if (!isValidBranchId(branchId)) {
    return sendValidationError(
      res,
      'A valid branch ID is required',
    );
  }

  next();
};

export const validateUpdateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, mobile, role, branchId } = req.body;

  if (
    name === undefined &&
    email === undefined &&
    mobile === undefined &&
    role === undefined &&
    branchId === undefined
  ) {
    return sendValidationError(
      res,
      'At least one user field is required for update',
    );
  }

  if (name !== undefined && !isNonEmptyString(name)) {
    return sendValidationError(res, 'Name cannot be empty');
  }

  if (email !== undefined && !isValidEmail(email)) {
    return sendValidationError(
      res,
      'Please provide a valid email address',
    );
  }

  if (mobile !== undefined && !isNonEmptyString(mobile)) {
    return sendValidationError(
      res,
      'Mobile number cannot be empty',
    );
  }

  if (role !== undefined && !isValidRole(role)) {
    return sendValidationError(
      res,
      'Please provide a valid user role',
    );
  }

  if (branchId !== undefined) {
    // Do not accept null to remove a user's branch assignment.
    if (!isValidBranchId(branchId)) {
      return sendValidationError(
        res,
        'A valid branch ID is required',
      );
    }
  }

  next();
};

export const validateUserStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return sendValidationError(
      res,
      'isActive must be true or false',
    );
  }

  next();
};
