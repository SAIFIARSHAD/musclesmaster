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

const validDateQuery = (field: string) =>
  query(field)
    .optional()
    .custom(isValidDateKey)
    .withMessage(`${field} must be a valid date in YYYY-MM-DD format.`);

const validPagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
];

const validAttendanceId = param('attendanceId')
  .notEmpty()
  .withMessage('Attendance ID is required.')
  .isMongoId()
  .withMessage('Invalid attendance record ID.');

const validIsoDateTime = (field: string) =>
  body(field)
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage(`${field} must be a valid ISO date-time.`);

// --------------------------------------------------
// EXISTING QR / RECEPTION VALIDATORS
// --------------------------------------------------

export const manualCheckInValidator = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),
];

export const qrCheckInValidator = [
  body('qrCode')
    .isString()
    .withMessage('QR code must be a string.')
    .trim()
    .notEmpty()
    .withMessage('QR code is required.'),
];

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

export const qrCheckOutValidator = [
  body('qrCode')
    .isString()
    .withMessage('QR code must be a string.')
    .trim()
    .notEmpty()
    .withMessage('QR code is required.'),
];

export const manualCheckOutValidator = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),
];

// Legacy branch attendance query.
export const branchAttendanceQueryValidator = [
  query('date')
    .optional()
    .custom(isValidDateKey)
    .withMessage('Date must be a valid date in YYYY-MM-DD format.'),

  query('status')
    .optional()
    .isIn(['checked-in', 'checked-out'])
    .withMessage('Invalid attendance status.'),

  ...validPagination,
];

// Member attendance history.
export const memberAttendanceHistoryValidator = [
  param('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),

  validDateQuery('startDate'),
  validDateQuery('endDate'),

  ...validPagination,
];

// --------------------------------------------------
// NEW SESSION-BASED ATTENDANCE VALIDATORS
// --------------------------------------------------

// Daily attendance filters.
export const dailyAttendanceQueryValidator = [
  query('date')
    .notEmpty()
    .withMessage('Attendance date is required.')
    .custom(isValidDateKey)
    .withMessage('Date must be a valid date in YYYY-MM-DD format.'),

  query('status')
    .optional()
    .isIn(['present', 'absent'])
    .withMessage('Status must be present or absent.'),

  ...validPagination,
];

// Live attendance filters.
export const liveAttendanceQueryValidator = [
  ...validPagination,
];

// Manual past-date attendance entry.
// Both check-in and check-out are required for a completed historical visit.
export const manualAttendanceValidator = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required.')
    .isMongoId()
    .withMessage('Invalid member ID.'),

  body('attendanceDateKey')
    .notEmpty()
    .withMessage('Attendance date is required.')
    .custom(isValidDateKey)
    .withMessage('Attendance date must use YYYY-MM-DD format.'),

  validIsoDateTime('checkInTime'),
  validIsoDateTime('checkOutTime'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Manual attendance reason is required.')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters.'),
];

// Update existing attendance session.
export const updateAttendanceValidator = [
  validAttendanceId,

  body('checkInTime')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Check-in time must be a valid ISO date-time.'),

  body('checkOutTime')
    .optional({ nullable: true })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Check-out time must be a valid ISO date-time.'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Correction reason is required.')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters.'),

  body().custom((value) => {
    if (
      value.checkInTime === undefined &&
      value.checkOutTime === undefined
    ) {
      throw new Error('At least one attendance time must be updated.');
    }

    return true;
  }),
];

// Void attendance session.
export const voidAttendanceValidator = [
  validAttendanceId,

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Void reason is required.')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters.'),
];

// Daily, weekly and monthly report filters.
export const attendanceReportQueryValidator = [
  validDateQuery('startDate'),
  validDateQuery('endDate'),

  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'custom'])
    .withMessage('Invalid report period.'),

  ...validPagination,
];
