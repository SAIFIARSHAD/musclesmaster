
import mongoose from 'mongoose';
import { createHash } from 'crypto';

import {
  Member,
  MemberStatus,
} from '../models/Member.model';

import {
  Membership,
  MembershipStatus,
} from '../models/Membership.model';

import { Branch } from '../models/Branch.model';

import {
  AttendanceLog,
  AttendanceStatus,
  AttendanceMethod,
} from '../models/AttendanceLog.model';

const fail = (
  message: string,
  statusCode = 400,
): never => {
  throw Object.assign(new Error(message), { statusCode });
};

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

export interface AttendanceActor {
  userId: string;
  branchId?: string;
}

/**
 * QR Check-in
 *
 * Validates:
 * 1. QR token
 * 2. Member status
 * 3. Branch status and ownership
 * 4. Active membership and date range
 * 5. Duplicate daily attendance
 */
export const checkInByQr = async (
  qrCode: string,
  actor: AttendanceActor,
) => {
  if (!qrCode?.trim()) {
    return fail('QR code is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  // Convert scanned token into SHA-256 hash.
  const tokenHash = createHash('sha256')
    .update(qrCode.trim())
    .digest('hex');

  // Find member using QR token hash.
  const member = await Member.findOne({
    qrTokenHash: tokenHash,
  });

  if (!member) {
    return fail('Invalid or unrecognized member QR code.', 404);
  }

  // Validate member status.
  if (member.status !== MemberStatus.ACTIVE) {
    return fail('This member account is inactive.', 400);
  }

  // Validate branch ownership.
  if (String(member.branchId) !== actor.branchId) {
    return fail(
      'This member does not belong to your assigned branch.',
      403,
    );
  }

  // Validate branch status.
  const branch = await Branch.findOne({
    _id: member.branchId,
    isActive: true,
  });

  if (!branch) {
    return fail('Member branch is inactive.', 400);
  }

  // Use UTC calendar-day boundaries for membership dates.
 // Generate attendance date using India timezone.
const now = new Date();

const attendanceDateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);

// Calculate India calendar-day boundaries for membership validation.
const [year, month, day] = attendanceDateKey.split('-').map(Number);

const todayStart = new Date(
  Date.UTC(year, month - 1, day) - 330 * 60 * 1000,
);

const todayEnd = new Date(
  todayStart.getTime() + 24 * 60 * 60 * 1000 - 1,
);

  // Find a valid active membership.
  const membership = await Membership.findOne({
    memberId: member._id,
    branchId: member.branchId,
    status: MembershipStatus.ACTIVE,
    startDate: { $lte: todayEnd },
    endDate: { $gte: todayStart },
  }).sort({ endDate: -1 });

  if (!membership) {
    return fail(
      'No valid active membership found. Please check membership status and dates.',
      403,
    );
  }

 // Prevent multiple check-ins on the same India calendar day.
const existingAttendance = await AttendanceLog.findOne({
  memberId: member._id,
  attendanceDateKey,
});

  if (existingAttendance) {
    return fail(
      'Attendance has already been marked for this member today.',
      409,
    );
  }

  // Create attendance record.
let attendance;

try {
  attendance = await AttendanceLog.create({
    memberId: member._id,
    branchId: member.branchId,
    attendanceDateKey,
    checkInTime: now,
    checkInMethod: AttendanceMethod.QR,
    checkOutTime: null,
    checkOutMethod: null,
    attendanceStatus: AttendanceStatus.CHECKED_IN,
  });
} catch (error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    return fail(
      'Attendance has already been marked for this member today.',
      409,
    );
  }

  throw error;
}

  return {
    attendance,
    member: {
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`,
    },
    branch: {
      id: branch._id,
      name: branch.name,
    },
    message: 'Attendance check-in successful.',
  };
};


/**
 * Reception Manual Check-in
 *
 * Validates:
 * 1. Member ID
 * 2. Reception assigned branch
 * 3. Member active status
 * 4. Branch active status
 * 5. Active membership and date range
 * 6. Duplicate daily attendance
 */
export const checkInManually = async (
  memberId: string,
  actor: AttendanceActor,
) => {
  if (!memberId?.trim() || !mongoose.isValidObjectId(memberId)) {
    return fail('A valid member ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  // Find member.
  const member = await Member.findById(memberId);

  if (!member) {
    return fail('Member not found.', 404);
  }

  // Validate member status.
  if (member.status !== MemberStatus.ACTIVE) {
    return fail('This member account is inactive.', 400);
  }

  // Validate branch ownership.
  if (String(member.branchId) !== actor.branchId) {
    return fail(
      'This member does not belong to your assigned branch.',
      403,
    );
  }

  // Validate branch status.
  const branch = await Branch.findOne({
    _id: member.branchId,
    isActive: true,
  });

  if (!branch) {
    return fail('Member branch is inactive.', 400);
  }

  // Calculate India calendar date.
  const now = new Date();

  const attendanceDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const [year, month, day] = attendanceDateKey
    .split('-')
    .map(Number);

  const todayStart = new Date(
    Date.UTC(year, month - 1, day) - 330 * 60 * 1000,
  );

  const todayEnd = new Date(
    todayStart.getTime() + 24 * 60 * 60 * 1000 - 1,
  );

  // Validate active membership.
  const membership = await Membership.findOne({
    memberId: member._id,
    branchId: member.branchId,
    status: MembershipStatus.ACTIVE,
    startDate: { $lte: todayEnd },
    endDate: { $gte: todayStart },
  }).sort({ endDate: -1 });

  if (!membership) {
    return fail(
      'No valid active membership found. Please check membership status and dates.',
      403,
    );
  }

  // Check existing attendance.
  const existingAttendance = await AttendanceLog.findOne({
    memberId: member._id,
    attendanceDateKey,
  });

  if (existingAttendance) {
    return fail(
      'Attendance has already been marked for this member today.',
      409,
    );
  }

  try {
    // Create manual check-in record.
    const attendance = await AttendanceLog.create({
  memberId: member._id,
  branchId: member.branchId,
  attendanceDateKey,
  checkInTime: now,
  checkInMethod: AttendanceMethod.MANUAL,
  checkOutTime: null,
  checkOutMethod: null,
  attendanceStatus: AttendanceStatus.CHECKED_IN,
});

    return {
      attendance,
      member: {
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`,
      },
      branch: {
        id: branch._id,
        name: branch.name,
      },
      message: 'Manual attendance check-in successful.',
    };
  } catch (error: unknown) {
    // Handle concurrent duplicate requests using unique index.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return fail(
        'Attendance has already been marked for this member today.',
        409,
      );
    }

    throw error;
  }
};


/**
 * QR Check-out
 *
 * Validates:
 * 1. QR token
 * 2. Member status
 * 3. Reception branch ownership
 * 4. Active branch
 * 5. Existing open attendance
 * 6. Duplicate check-out
 */

export const checkOutByQr = async (
  qrCode: string,
  actor: AttendanceActor,
) => {
  if (!qrCode?.trim()) {
    return fail('QR code is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  const tokenHash = createHash('sha256')
    .update(qrCode.trim())
    .digest('hex');

  const member = await Member.findOne({
    qrTokenHash: tokenHash,
  });

  if (!member) {
    return fail('Invalid or unrecognized member QR code.', 404);
  }

  if (member.status !== MemberStatus.ACTIVE) {
    return fail('This member account is inactive.', 400);
  }

  if (String(member.branchId) !== actor.branchId) {
    return fail(
      'This member does not belong to your assigned branch.',
      403,
    );
  }

  const branch = await Branch.findOne({
    _id: member.branchId,
    isActive: true,
  });

  if (!branch) {
    return fail('Member branch is inactive.', 400);
  }

  const now = new Date();

  const attendanceDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Atomic update: only one concurrent request can check out.
  const attendance = await AttendanceLog.findOneAndUpdate(
    {
      memberId: member._id,
      branchId: member.branchId,
      attendanceDateKey,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    },
    {
      $set: {
        checkOutTime: now,
        checkOutMethod: AttendanceMethod.QR,
        attendanceStatus: AttendanceStatus.CHECKED_OUT,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!attendance) {
    return fail(
      'No active check-in found for this member today. Attendance may already be checked out.',
      409,
    );
  }

  return {
    attendance,
    member: {
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`,
    },
    branch: {
      id: branch._id,
      name: branch.name,
    },
    message: 'QR attendance check-out successful.',
  };
};




/**
 * Reception Manual Check-out
 *
 * Validates:
 * 1. Member ID
 * 2. Reception branch ownership
 * 3. Active branch
 * 4. Existing open attendance
 * 5. Duplicate check-out
 */

export const checkOutManually = async (
  memberId: string,
  actor: AttendanceActor,
) => {
  if (!memberId?.trim() || !mongoose.isValidObjectId(memberId)) {
    return fail('A valid member ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  const member = await Member.findById(memberId);

  if (!member) {
    return fail('Member not found.', 404);
  }

  if (String(member.branchId) !== actor.branchId) {
    return fail(
      'This member does not belong to your assigned branch.',
      403,
    );
  }

  const branch = await Branch.findOne({
    _id: member.branchId,
    isActive: true,
  });

  if (!branch) {
    return fail('Member branch is inactive.', 400);
  }

  const now = new Date();

  const attendanceDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Atomic update prevents concurrent manual check-outs.
  const attendance = await AttendanceLog.findOneAndUpdate(
    {
      memberId: member._id,
      branchId: member.branchId,
      attendanceDateKey,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    },
    {
      $set: {
        checkOutTime: now,
        checkOutMethod: AttendanceMethod.MANUAL,
        attendanceStatus: AttendanceStatus.CHECKED_OUT,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!attendance) {
    return fail(
      'No active check-in found for this member today. Attendance may already be checked out.',
      409,
    );
  }

  return {
    attendance,
    member: {
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`,
    },
    branch: {
      id: branch._id,
      name: branch.name,
    },
    message: 'Manual attendance check-out successful.',
  };
};



/**
 * Get Branch-wise Attendance List
 *
 * Features:
 * 1. Branch-wise attendance
 * 2. Date filtering
 * 3. Attendance status filtering
 * 4. Pagination
 * 5. Member details population
 */
export const getBranchAttendance = async (
  actor: AttendanceActor,
  filters: {
    date?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  },
) => {
  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  // Validate date format.
if (filters.date && !isValidDateKey(filters.date)) {
  return fail(
    'Date must be a valid date in YYYY-MM-DD format.',
    400,
  );
}

  // Validate attendance status.
  if (
    filters.status &&
    !Object.values(AttendanceStatus).includes(filters.status)
  ) {
    return fail('Invalid attendance status.', 400);
  }

  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(filters.limit || 10)),
  );

  const skip = (page - 1) * limit;

  // Always restrict records to the actor's assigned branch.
  const query: {
    branchId: mongoose.Types.ObjectId;
    attendanceDateKey?: string;
    attendanceStatus?: AttendanceStatus;
  } = {
    branchId: new mongoose.Types.ObjectId(actor.branchId),
  };

  if (filters.date) {
    query.attendanceDateKey = filters.date;
  }

  if (filters.status) {
    query.attendanceStatus = filters.status;
  }

  const [attendance, totalRecords] = await Promise.all([
    AttendanceLog.find(query)
      .populate('memberId', 'memberId firstName lastName')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AttendanceLog.countDocuments(query),
  ]);

  return {
    attendance,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
    filters: {
      date: filters.date || null,
      status: filters.status || null,
    },
  };
};

/**
 * Get Member Attendance History
 *
 * Features:
 * 1. Member-wise attendance history
 * 2. Branch ownership validation
 * 3. Date-wise filtering
 * 4. Pagination
 * 5. Latest attendance first
 */
export const getMemberAttendanceHistory = async (
  memberId: string,
  actor: AttendanceActor,
  filters: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) => {
  if (!memberId || !mongoose.isValidObjectId(memberId)) {
    return fail('A valid member ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  // Validate date format.
  const isValidDate = (value?: string) => {
    if (!value) return true;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  if (
    !isValidDate(filters.startDate) ||
    !isValidDate(filters.endDate)
  ) {
    return fail('Dates must be valid and use YYYY-MM-DD format.', 400);
  }

  if (
    filters.startDate &&
    filters.endDate &&
    filters.startDate > filters.endDate
  ) {
    return fail('Start date cannot be after end date.', 400);
  }

  // Verify member and branch ownership.
  const member = await Member.findOne({
    _id: memberId,
    branchId: actor.branchId,
  });

  if (!member) {
    return fail(
      'Member not found in your assigned branch.',
      404,
    );
  }

  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(filters.limit || 10)),
  );

  const skip = (page - 1) * limit;

  const query: {
    memberId: mongoose.Types.ObjectId;
    branchId: mongoose.Types.ObjectId;
    attendanceDateKey?: {
      $gte?: string;
      $lte?: string;
    };
  } = {
    memberId: member._id,
    branchId: new mongoose.Types.ObjectId(actor.branchId),
  };

  if (filters.startDate || filters.endDate) {
    query.attendanceDateKey = {};

    if (filters.startDate) {
      query.attendanceDateKey.$gte = filters.startDate;
    }

    if (filters.endDate) {
      query.attendanceDateKey.$lte = filters.endDate;
    }
  }

  const [attendance, totalRecords] = await Promise.all([
    AttendanceLog.find(query)
      .sort({ attendanceDateKey: -1, checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AttendanceLog.countDocuments(query),
  ]);

  return {
    member: {
      id: member._id,
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`,
    },
    attendance,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
    filters: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
    },
  };
};
