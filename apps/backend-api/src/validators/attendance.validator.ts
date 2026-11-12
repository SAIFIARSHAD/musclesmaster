
import { body, param, query } from 'express-validator';

// Validate YYYY-MM-DD and ensure it is a real calendar date.
const isValidDateKey = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// Reception Manual Check-in.
export const manualCheckInValidator = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),
];

// QR Check-in.
export const qrCheckInValidator = [
  body('qrCode')
    .isString()
    .withMessage('QR code must be a string.')
    .trim()
    .notEmpty()
    .withMessage('QR code is required.'),
];

// Legacy validators retained for compatibility.
export const checkOutValidator = [
  param('id')
    .notEmpty()
    .withMessage('Attendance ID is required.')
    .isMongoId()
    .withMessage('Invalid attendance record ID.'),
];

export const attendanceListValidator = [
  param('id')
    .optional()
    .isMongoId()
    .withMessage('Invalid ID.'),
];

// QR Check-out.
export const qrCheckOutValidator = [
  body('qrCode')
    .isString()
    .withMessage('QR code must be a string.')
    .trim()
    .notEmpty()
    .withMessage('QR code is required.'),
];

// Reception Manual Check-out.
export const manualCheckOutValidator = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),
];

// Branch Attendance List Query.
export const branchAttendanceQueryValidator = [
  query('date')
    .optional()
    .custom(isValidDateKey)
    .withMessage('Date must be a valid date in YYYY-MM-DD format.'),

  query('status')
    .optional()
    .isIn(['checked-in', 'checked-out'])
    .withMessage('Invalid attendance status.'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
];

// Member Attendance History.
export const memberAttendanceHistoryValidator = [
  param('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),

  query('startDate')
    .optional()
    .custom(isValidDateKey)
    .withMessage('Start date must be a valid date in YYYY-MM-DD format.'),

  query('endDate')
    .optional()
    .custom(isValidDateKey)
    .withMessage('End date must be a valid date in YYYY-MM-DD format.'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
];
