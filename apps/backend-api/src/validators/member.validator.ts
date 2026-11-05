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
  if (typeof value !== 'string') return false;

  // Strict YYYY-MM-DD format and real calendar date.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isFutureDate = (value: string): boolean => {
  const date = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return date > today;
};

const isValidGender = (value: unknown): value is MemberGender =>
  typeof value === 'string' &&
  Object.values(MemberGender).includes(value as MemberGender);

// CREATE MEMBER VALIDATION
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
    password,
    branchId,
    address,
    height,
    weight,
    fitnessGoal,
    medicalConditions,
    trainerId,
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
    return sendValidationError(
      res,
      'Date of birth must be a valid date in YYYY-MM-DD format',
    );
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

  if (!isValidEmail(email)) {
    return sendValidationError(res, 'A valid email address is required');
  }

  if (!isNonEmptyString(password) || password.trim().length < 8) {
    return sendValidationError(
      res,
      'Password must be at least 8 characters',
    );
  }

  if (branchId !== undefined && !isValidObjectId(branchId)) {
    return sendValidationError(res, 'Invalid branch ID');
  }

  if (address !== undefined && typeof address !== 'string') {
    return sendValidationError(res, 'Address must be a string');
  }

  if (height !== undefined) {
    if (
      typeof height !== 'number' ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      return sendValidationError(res, 'Height must be a positive number');
    }
  }

  if (weight !== undefined) {
    if (
      typeof weight !== 'number' ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return sendValidationError(res, 'Weight must be a positive number');
    }
  }

  if (fitnessGoal !== undefined && typeof fitnessGoal !== 'string') {
    return sendValidationError(res, 'Fitness goal must be a string');
  }

  if (
    medicalConditions !== undefined &&
    (
      !Array.isArray(medicalConditions) ||
      !medicalConditions.every(
        (condition: unknown) => typeof condition === 'string',
      )
    )
  ) {
    return sendValidationError(
      res,
      'Medical conditions must be an array of strings',
    );
  }

  // Trainer assignment is optional. Null means no trainer assigned.
  if (
    trainerId !== undefined &&
    trainerId !== null &&
    !isValidObjectId(trainerId)
  ) {
    return sendValidationError(res, 'Invalid trainer ID');
  }

  next();
};

// UPDATE MEMBER VALIDATION

export const validateUpdateMember = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = req.body;

  const allowedFields = [
    'firstName',
    'lastName',
    'gender',
    'dob',
    'mobile',
    'email',
    'address',
    'height',
    'weight',
    'fitnessGoal',
    'medicalConditions',
  ];

  // Reject restricted or unknown fields instead of silently ignoring them.
  const invalidFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );

  if (invalidFields.length > 0) {
    return sendValidationError(
      res,
      `These fields cannot be updated here: ${invalidFields.join(', ')}`,
    );
  }

  if (Object.keys(body).length === 0) {
    return sendValidationError(
      res,
      'At least one member field is required',
    );
  }

  if (
    body.firstName !== undefined &&
    !isNonEmptyString(body.firstName)
  ) {
    return sendValidationError(res, 'First name cannot be empty');
  }

  if (
    body.lastName !== undefined &&
    !isNonEmptyString(body.lastName)
  ) {
    return sendValidationError(res, 'Last name cannot be empty');
  }

  if (
    body.gender !== undefined &&
    !isValidGender(body.gender)
  ) {
    return sendValidationError(res, 'Please provide a valid gender');
  }

  if (body.dob !== undefined) {
    if (!isValidDate(body.dob)) {
      return sendValidationError(
        res,
        'Please provide a valid DOB in YYYY-MM-DD format',
      );
    }

    if (isFutureDate(body.dob)) {
      return sendValidationError(
        res,
        'Date of birth cannot be in the future',
      );
    }
  }

  if (
    body.mobile !== undefined &&
    !isValidMobile(body.mobile)
  ) {
    return sendValidationError(
      res,
      'Please provide a valid 10-digit Indian mobile number',
    );
  }

  if (
    body.email !== undefined &&
    !isValidEmail(body.email)
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address',
    );
  }

  if (
    body.address !== undefined &&
    typeof body.address !== 'string'
  ) {
    return sendValidationError(res, 'Address must be a string');
  }

  if (body.height !== undefined) {
    if (
      typeof body.height !== 'number' ||
      !Number.isFinite(body.height) ||
      body.height <= 0
    ) {
      return sendValidationError(
        res,
        'Height must be a positive number',
      );
    }
  }

  if (body.weight !== undefined) {
    if (
      typeof body.weight !== 'number' ||
      !Number.isFinite(body.weight) ||
      body.weight <= 0
    ) {
      return sendValidationError(
        res,
        'Weight must be a positive number',
      );
    }
  }

  if (
    body.fitnessGoal !== undefined &&
    typeof body.fitnessGoal !== 'string'
  ) {
    return sendValidationError(
      res,
      'Fitness goal must be a string',
    );
  }

  if (
    body.medicalConditions !== undefined &&
    (
      !Array.isArray(body.medicalConditions) ||
      !body.medicalConditions.every(
        (condition: unknown) => typeof condition === 'string',
      )
    )
  ) {
    return sendValidationError(
      res,
      'Medical conditions must be an array of strings',
    );
  }

  next();
};

