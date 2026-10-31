import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MemberGender } from '../models/Member.model';

const sendValidationError = (res: Response, message: string) => {
  return res.status(400).json({
    success: false,
    message,
  });
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidMobile = (value: unknown): value is string =>
  typeof value === 'string' && /^[6-9]\d{9}$/.test(value.trim());

const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidObjectId = (value: unknown): value is string =>
  typeof value === 'string' &&
  mongoose.isValidObjectId(value.trim());

const isValidDate = (value: unknown): boolean => {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

const isFutureDate = (value: string | Date): boolean => {
  const date = new Date(value);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date > today;
};

const isValidGender = (value: unknown): value is MemberGender =>
  typeof value === 'string' &&
  Object.values(MemberGender).includes(value as MemberGender);

// Create Member Validation
export const validateCreateMember = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    firstName,
    lastName,
    gender,
    dob,
    mobile,
    email,
    branchId,
  } = req.body;

  if (!isNonEmptyString(firstName)) {
    return sendValidationError(res, 'First name is required');
  }

  if (!isNonEmptyString(lastName)) {
    return sendValidationError(res, 'Last name is required');
  }

  if (!isValidGender(gender)) {
    return sendValidationError(res, 'Please provide a valid gender');
  }

  if (!isValidDate(dob)) {
    return sendValidationError(res, 'A valid date of birth is required');
  }

  if (isFutureDate(dob)) {
    return sendValidationError(
      res,
      'Date of birth cannot be in the future',
    );
  }

  if (!isValidMobile(mobile)) {
    return sendValidationError(
      res,
      'Please provide a valid 10-digit Indian mobile number',
    );
  }

  if (email !== undefined && email !== null && email !== '') {
    if (!isValidEmail(email)) {
      return sendValidationError(
        res,
        'Please provide a valid email address',
      );
    }
  }

  if (!isValidObjectId(branchId)) {
    return sendValidationError(
      res,
      'A valid branch ID is required',
    );
  }

  next();
};

// Update Member Validation
export const validateUpdateMember = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    firstName,
    lastName,
    gender,
    dob,
    mobile,
    email,
    branchId,
  } = req.body;

  const allowedFields = [
    'firstName',
    'lastName',
    'gender',
    'dob',
    'mobile',
    'email',
    'address',
  ];

  const hasAllowedField = allowedFields.some(
    (field) => req.body[field] !== undefined,
  );

  if (!hasAllowedField) {
    return sendValidationError(
      res,
      'At least one valid member field is required',
    );
  }

  if (firstName !== undefined && !isNonEmptyString(firstName)) {
    return sendValidationError(res, 'First name cannot be empty');
  }

  if (lastName !== undefined && !isNonEmptyString(lastName)) {
    return sendValidationError(res, 'Last name cannot be empty');
  }

  if (gender !== undefined && !isValidGender(gender)) {
    return sendValidationError(res, 'Please provide a valid gender');
  }

  if (dob !== undefined) {
    if (!isValidDate(dob)) {
      return sendValidationError(res, 'Please provide a valid date of birth');
    }

    if (isFutureDate(dob)) {
      return sendValidationError(
        res,
        'Date of birth cannot be in the future',
      );
    }
  }

  if (mobile !== undefined && !isValidMobile(mobile)) {
    return sendValidationError(
      res,
      'Please provide a valid 10-digit Indian mobile number',
    );
  }

  if (
    email !== undefined &&
    email !== null &&
    email !== '' &&
    !isValidEmail(email)
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address',
    );
  }

  // Branch transfer will be handled through a separate
  // authorized workflow, not this general update validator.
  if (branchId !== undefined) {
    return sendValidationError(
      res,
      'Branch cannot be changed through member update',
    );
  }

  if (
    req.body.address !== undefined &&
    typeof req.body.address !== 'string'
  ) {
    return sendValidationError(res, 'Address must be a string');
  }

  next();
};
