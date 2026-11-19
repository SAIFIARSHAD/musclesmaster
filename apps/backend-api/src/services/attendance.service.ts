import mongoose from 'mongoose';
import { createHash, randomUUID } from 'crypto';

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

import {
  AttendanceAuditLog,
  AttendanceAuditAction,
} from '../models/AttendanceAuditLog.model';

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


const getIndiaDateKey = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getIndiaDayBounds = (dateKey: string) => {
  if (!isValidDateKey(dateKey)) {
    return fail('Invalid attendance date.', 400);
  }

  const [year, month, day] = dateKey.split('-').map(Number);

  const start = new Date(
    Date.UTC(year, month - 1, day) - 330 * 60 * 1000,
  );

  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000 - 1,
  );

  return { start, end };
};

const calculateDurationMinutes = (
  checkInTime: Date,
  checkOutTime: Date,
): number => {
  const duration =
    (checkOutTime.getTime() - checkInTime.getTime()) / 60000;

  return Math.max(0, Math.floor(duration));
};

const validateCheckoutTime = (
  checkInTime: Date,
  checkOutTime: Date,
): void => {
  if (checkOutTime.getTime() <= checkInTime.getTime()) {
    fail('Check-out time must be after check-in time.', 400);
  }
};

const createAttendanceAudit = async (data: {
  attendanceId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  action: AttendanceAuditAction;
  actor: AttendanceActor;
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) => {
  return AttendanceAuditLog.create({
    attendanceId: data.attendanceId,
    memberId: data.memberId,
    branchId: data.branchId,
    action: data.action,
    performedBy: new mongoose.Types.ObjectId(data.actor.userId),
    performedByRole: 'BRANCH_ADMIN',
    reason: data.reason ?? null,
    before: data.before ?? null,
    after: data.after ?? null,
  });
};

const getMembershipDateValue = (dateKey: string): Date => {
  if (!isValidDateKey(dateKey)) {
    return fail('Invalid membership date.', 400);
  }

  return new Date(`${dateKey}T00:00:00.000Z`);
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
  const attendanceDateKey = getIndiaDateKey(now);
  const { start: todayStart, end: todayEnd } =
    getIndiaDayBounds(attendanceDateKey);

  const membershipDate = getMembershipDateValue(attendanceDateKey);

const membership = await Membership.findOne({
  memberId: member._id,
  branchId: member.branchId,
  status: MembershipStatus.ACTIVE,
  startDate: { $lte: membershipDate },
  endDate: { $gte: membershipDate },
});

  if (!membership) {
    return fail(
      'No valid active membership found. Please check membership status and dates.',
      403,
    );
  }

  // Block only if a previous session is still open.
  const existingOpenSession = await AttendanceLog.findOne({
    memberId: member._id,
    attendanceStatus: AttendanceStatus.CHECKED_IN,
  });

  if (existingOpenSession) {
    return fail(
      'This member already has an active gym session. Please check out first.',
      409,
    );
  }

  try {
    const attendance = await AttendanceLog.create({
      memberId: member._id,
      branchId: member.branchId,
      attendanceDateKey,
      checkInTime: now,
      checkInMethod: AttendanceMethod.QR,
      checkOutTime: null,
      checkOutMethod: null,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      durationMinutes: null,
      isManual: false,
      manualReason: null,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
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
      message: 'QR attendance check-in successful.',
    };
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return fail(
        'This member already has an active gym session. Please check out first.',
        409,
      );
    }

    throw error;
  }
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

  const member = await Member.findById(memberId);

  if (!member) {
    return fail('Member not found.', 404);
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
  const attendanceDateKey = getIndiaDateKey(now);
  const { start: todayStart, end: todayEnd } =
    getIndiaDayBounds(attendanceDateKey);

const membershipDate = getMembershipDateValue(attendanceDateKey);

const membership = await Membership.findOne({
  memberId: member._id,
  branchId: member.branchId,
  status: MembershipStatus.ACTIVE,
  startDate: { $lte: membershipDate },
  endDate: { $gte: membershipDate },
});

  if (!membership) {
    return fail(
      'No valid active membership found. Please check membership status and dates.',
      403,
    );
  }

  const existingOpenSession = await AttendanceLog.findOne({
    memberId: member._id,
    attendanceStatus: AttendanceStatus.CHECKED_IN,
  });

  if (existingOpenSession) {
    return fail(
      'This member already has an active gym session. Please check out first.',
      409,
    );
  }

  try {
    const attendance = await AttendanceLog.create({
      memberId: member._id,
      branchId: member.branchId,
      attendanceDateKey,
      checkInTime: now,
      checkInMethod: AttendanceMethod.MANUAL,
      checkOutTime: null,
      checkOutMethod: null,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      durationMinutes: null,
      isManual: false,
      manualReason: null,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
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
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return fail(
        'This member already has an active gym session. Please check out first.',
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

  // Find the member's currently open session.
  // No date restriction: an overnight open session can also be resolved.
  const attendance = await AttendanceLog.findOneAndUpdate(
    {
      memberId: member._id,
      branchId: member.branchId,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    },
    [
      {
        $set: {
          checkOutTime: now,
          checkOutMethod: AttendanceMethod.QR,
          attendanceStatus: AttendanceStatus.CHECKED_OUT,
          durationMinutes: {
            $max: [
              0,
              {
                $floor: {
                  $divide: [
                    { $subtract: [now, '$checkInTime'] },
                    60000,
                  ],
                },
              },
            ],
          },
        },
      },
    ],
    {
      new: true,
    },
  );

  if (!attendance) {
    return fail(
      'No active gym session found for this member. Please check in first.',
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


export const processQrAttendance = async (
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

  if (String(member.branchId) !== actor.branchId) {
    return fail(
      'This member does not belong to your assigned branch.',
      403,
    );
  }

  const now = new Date();
  const lockId = randomUUID();
  const lockUntil = new Date(now.getTime() + 30 * 1000);

  // Atomically acquire the member QR lock.
  const lockedMember = await Member.findOneAndUpdate(
    {
      _id: member._id,
      branchId: new mongoose.Types.ObjectId(actor.branchId),
      $and: [
        {
          $or: [
            { qrAttendanceCooldownUntil: null },
            { qrAttendanceCooldownUntil: { $exists: false } },
            { qrAttendanceCooldownUntil: { $lte: now } },
          ],
        },
        {
          $or: [
            { qrAttendanceLockUntil: null },
            { qrAttendanceLockUntil: { $exists: false } },
            { qrAttendanceLockUntil: { $lte: now } },
          ],
        },
      ],
    },
    {
      $set: {
        qrAttendanceLockId: lockId,
        qrAttendanceLockUntil: lockUntil,
        qrAttendanceCooldownUntil: lockUntil,
      },
    },
    { new: true },
  );

  if (!lockedMember) {
    const latestMember = await Member.findById(member._id);

    const activeUntil =
      latestMember?.qrAttendanceCooldownUntil ||
      latestMember?.qrAttendanceLockUntil ||
      new Date(Date.now() + 30 * 1000);

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((activeUntil.getTime() - Date.now()) / 1000),
    );

    throw Object.assign(
      new Error('This member QR code is temporarily blocked.'),
      {
        statusCode: 429,
        data: {
          member: {
            memberId: member.memberId,
            name: `${member.firstName} ${member.lastName}`,
          },
          cooldownUntil: activeUntil.toISOString(),
          retryAfterSeconds,
        },
      },
    );
  }

  try {
    // Determine whether the member is checking in or checking out.
    const existingOpenSession = await AttendanceLog.findOne({
      memberId: member._id,
      branchId: member.branchId,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    });

    const action = existingOpenSession ? 'CHECK_OUT' : 'CHECK_IN';

    // Reuse existing QR attendance services.
    const result =
      action === 'CHECK_IN'
        ? await checkInByQr(qrCode, actor)
        : await checkOutByQr(qrCode, actor);

    // Apply the 2-minute cooldown after successful attendance.
    const cooldownUntil = new Date(Date.now() + 2 * 60 * 1000);

    const finalized = await Member.findOneAndUpdate(
      {
        _id: member._id,
        qrAttendanceLockId: lockId,
      },
      {
        $set: {
          qrAttendanceCooldownUntil: cooldownUntil,
          qrAttendanceLockId: null,
          qrAttendanceLockUntil: null,
        },
      },
      { new: true },
    );

    if (!finalized) {
      throw new Error('Unable to finalize QR attendance cooldown.');
    }

    return {
      ...result,
      action,
      cooldownUntil: cooldownUntil.toISOString(),
      retryAfterSeconds: 120,
    };
  } catch (error: unknown) {
    // Release the lock if attendance processing fails.
    await Member.updateOne(
      {
        _id: member._id,
        qrAttendanceLockId: lockId,
      },
      {
        $set: {
          qrAttendanceCooldownUntil: null,
          qrAttendanceLockId: null,
          qrAttendanceLockUntil: null,
        },
      },
    );

    throw error;
  }
};



export const processManualMemberAttendance = async (
  memberId: string,
  actor: AttendanceActor,
) => {
  if (!memberId?.trim()) {
    return fail('Member ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('A valid authenticated user is required.', 403);
  }

  const normalizedMemberId = memberId.trim().toUpperCase();

  const member = await Member.findOne({
    memberId: normalizedMemberId,
  });

  if (!member) {
    return fail('Member not found.', 404);
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
  const lockId = randomUUID();
  const lockUntil = new Date(now.getTime() + 30 * 1000);

  // Atomically acquire the manual attendance lock.
  const lockedMember = await Member.findOneAndUpdate(
    {
      _id: member._id,
      branchId: new mongoose.Types.ObjectId(actor.branchId),
      $and: [
        {
          $or: [
            { manualAttendanceCooldownUntil: null },
            { manualAttendanceCooldownUntil: { $exists: false } },
            { manualAttendanceCooldownUntil: { $lte: now } },
          ],
        },
        {
          $or: [
            { manualAttendanceLockUntil: null },
            { manualAttendanceLockUntil: { $exists: false } },
            { manualAttendanceLockUntil: { $lte: now } },
          ],
        },
      ],
    },
    {
      $set: {
        manualAttendanceLockId: lockId,
        manualAttendanceLockUntil: lockUntil,
        manualAttendanceCooldownUntil: lockUntil,
      },
    },
    { new: true },
  );

  if (!lockedMember) {
    const latestMember = await Member.findById(member._id);

    const activeUntil =
      latestMember?.manualAttendanceCooldownUntil ||
      latestMember?.manualAttendanceLockUntil ||
      new Date(Date.now() + 30 * 1000);

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((activeUntil.getTime() - Date.now()) / 1000),
    );

    throw Object.assign(
      new Error('Manual attendance is temporarily blocked for this member.'),
      {
        statusCode: 429,
        data: {
          member: {
            memberId: member.memberId,
            name: `${member.firstName} ${member.lastName}`,
          },
          cooldownUntil: activeUntil.toISOString(),
          retryAfterSeconds,
        },
      },
    );
  }

  try {
    const existingOpenSession = await AttendanceLog.findOne({
      memberId: member._id,
      branchId: member.branchId,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    });

    let attendance;
    let action: 'CHECK_IN' | 'CHECK_OUT';

    if (existingOpenSession) {
      // Active session exists: check out.
      action = 'CHECK_OUT';

      attendance = await AttendanceLog.findOneAndUpdate(
        {
          _id: existingOpenSession._id,
          memberId: member._id,
          branchId: member.branchId,
          attendanceStatus: AttendanceStatus.CHECKED_IN,
          checkOutTime: null,
        },
        [
          {
            $set: {
              checkOutTime: now,
              checkOutMethod: AttendanceMethod.MANUAL,
              attendanceStatus: AttendanceStatus.CHECKED_OUT,
              durationMinutes: {
                $max: [
                  0,
                  {
                    $floor: {
                      $divide: [
                        { $subtract: [now, '$checkInTime'] },
                        60000,
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
        { new: true },
      );

      if (!attendance) {
        return fail('Unable to complete check-out. Please try again.', 409);
      }
    } else {
      // No active session: validate membership and check in.
      action = 'CHECK_IN';

      const attendanceDateKey = getIndiaDateKey(now);
      const { start: todayStart, end: todayEnd } =
        getIndiaDayBounds(attendanceDateKey);

const membershipDate = getMembershipDateValue(attendanceDateKey);

const membership = await Membership.findOne({
  memberId: member._id,
  branchId: member.branchId,
  status: MembershipStatus.ACTIVE,
  startDate: { $lte: membershipDate },
  endDate: { $gte: membershipDate },
});

      if (!membership) {
        return fail(
          'No valid active membership found. Please check membership status and dates.',
          403,
        );
      }

      attendance = await AttendanceLog.create({
        memberId: member._id,
        branchId: member.branchId,
        attendanceDateKey,
        checkInTime: now,
        checkInMethod: AttendanceMethod.MANUAL,
        checkOutTime: null,
        checkOutMethod: null,
        attendanceStatus: AttendanceStatus.CHECKED_IN,
        durationMinutes: null,
        isManual: false,
        manualReason: null,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
      });
    }

    // Apply 2-minute cooldown after successful attendance.
    const cooldownUntil = new Date(Date.now() + 2 * 60 * 1000);

    const finalized = await Member.findOneAndUpdate(
      {
        _id: member._id,
        manualAttendanceLockId: lockId,
      },
      {
        $set: {
          manualAttendanceCooldownUntil: cooldownUntil,
          manualAttendanceLockId: null,
          manualAttendanceLockUntil: null,
        },
      },
      { new: true },
    );

    if (!finalized) {
      throw new Error('Unable to finalize manual attendance cooldown.');
    }

    return {
      action,
      attendance,
      member: {
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`,
      },
      branch: {
        id: branch._id,
        name: branch.name,
      },
      message:
        action === 'CHECK_IN'
          ? 'Manual attendance check-in successful.'
          : 'Manual attendance check-out successful.',
      cooldownUntil: cooldownUntil.toISOString(),
      retryAfterSeconds: 120,
    };
  } catch (error: unknown) {
    // Release lock if attendance processing fails.
    await Member.updateOne(
      {
        _id: member._id,
        manualAttendanceLockId: lockId,
      },
      {
        $set: {
          manualAttendanceCooldownUntil: null,
          manualAttendanceLockId: null,
          manualAttendanceLockUntil: null,
        },
      },
    );

    throw error;
  }
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

  const attendance = await AttendanceLog.findOneAndUpdate(
    {
      memberId: member._id,
      branchId: member.branchId,
      attendanceStatus: AttendanceStatus.CHECKED_IN,
      checkOutTime: null,
    },
    [
      {
        $set: {
          checkOutTime: now,
          checkOutMethod: AttendanceMethod.MANUAL,
          attendanceStatus: AttendanceStatus.CHECKED_OUT,
          durationMinutes: {
            $max: [
              0,
              {
                $floor: {
                  $divide: [
                    { $subtract: [now, '$checkInTime'] },
                    60000,
                  ],
                },
              },
            ],
          },
        },
      },
    ],
    {
      new: true,
    },
  );

  if (!attendance) {
    return fail(
      'No active gym session found for this member. Please check in first.',
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



export const getDailyAttendance = async (
  actor: AttendanceActor,
  filters: {
    date?: string;
    status?: 'present' | 'absent';
    page?: number;
    limit?: number;
  },
) => {
  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  const attendanceDateKey = filters.date || getIndiaDateKey();

  if (!isValidDateKey(attendanceDateKey)) {
    return fail('Date must be a valid date in YYYY-MM-DD format.', 400);
  }

  const { start, end } = getIndiaDayBounds(attendanceDateKey);
  const branchId = new mongoose.Types.ObjectId(actor.branchId);

  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit || 10)));

  // Only active members belonging to this branch.
  const activeMembers = await Member.find({
    branchId,
    status: MemberStatus.ACTIVE,
  })
    .select('_id memberId firstName lastName mobile')
    .lean();

  // Only members with a valid active membership on the selected date.
  const activeMemberships = await Membership.find({
    branchId,
    memberId: { $in: activeMembers.map((member) => member._id) },
    status: MembershipStatus.ACTIVE,
    startDate: { $lte: end },
    endDate: { $gte: start },
  })
    .select('memberId')
    .lean();

  const eligibleMemberIds = new Set(
    activeMemberships.map((membership) => String(membership.memberId)),
  );

  const eligibleMembers = activeMembers.filter((member) =>
    eligibleMemberIds.has(String(member._id)),
  );

  const eligibleIds = eligibleMembers.map((member) => member._id);

  // Group all valid attendance sessions for each member.
  const sessionSummaries = await AttendanceLog.aggregate([
    {
      $match: {
        branchId,
        attendanceDateKey,
        memberId: { $in: eligibleIds },
        attendanceStatus: { $ne: AttendanceStatus.VOIDED },
      },
    },
    {
      $group: {
        _id: '$memberId',
        totalVisits: { $sum: 1 },
        totalDurationMinutes: {
          $sum: { $ifNull: ['$durationMinutes', 0] },
        },
        sessions: {
          $push: {
            attendanceId: '$attendanceId',
            checkInTime: '$checkInTime',
            checkOutTime: '$checkOutTime',
            attendanceStatus: '$attendanceStatus',
            durationMinutes: '$durationMinutes',
            checkInMethod: '$checkInMethod',
            checkOutMethod: '$checkOutMethod',
            isManual: '$isManual',
          },
        },
      },
    },
  ]);

  const summaryMap = new Map(
    sessionSummaries.map((summary) => [
      String(summary._id),
      summary,
    ]),
  );

  const dailyAttendance = eligibleMembers.map((member) => {
    const summary = summaryMap.get(String(member._id));

    return {
      member: {
        id: member._id,
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`,
        mobile: member.mobile,
      },
      date: attendanceDateKey,
      status: summary ? 'present' : 'absent',
      totalVisits: summary?.totalVisits ?? 0,
      totalDurationMinutes: summary?.totalDurationMinutes ?? 0,
      sessions: summary?.sessions ?? [],
    };
  });

  const filteredAttendance = filters.status
    ? dailyAttendance.filter(
        (record) => record.status === filters.status,
      )
    : dailyAttendance;

  const totalRecords = filteredAttendance.length;
  const skip = (page - 1) * limit;

  return {
    attendance: filteredAttendance.slice(skip, skip + limit),
    summary: {
      totalMembers: eligibleMembers.length,
      present: dailyAttendance.filter(
        (record) => record.status === 'present',
      ).length,
      absent: dailyAttendance.filter(
        (record) => record.status === 'absent',
      ).length,
    },
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
    filters: {
      date: attendanceDateKey,
      status: filters.status || null,
    },
  };
};


export const getLiveAttendance = async (
  actor: AttendanceActor,
  filters: {
    page?: number;
    limit?: number;
  },
) => {
  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  const branchId = new mongoose.Types.ObjectId(actor.branchId);

  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(filters.limit || 10)),
  );

  const skip = (page - 1) * limit;
  const now = new Date();

  const query = {
    branchId,
    attendanceStatus: AttendanceStatus.CHECKED_IN,
    checkOutTime: null,
  };

  const [attendance, totalRecords] = await Promise.all([
    AttendanceLog.find(query)
      .populate('memberId', 'memberId firstName lastName mobile')
      .sort({ checkInTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AttendanceLog.countDocuments(query),
  ]);

  const liveMembers = attendance.map((session) => {
    const checkInTime = new Date(session.checkInTime);

    const currentDurationMinutes = Math.max(
      0,
      Math.floor(
        (now.getTime() - checkInTime.getTime()) / 60000,
      ),
    );

    return {
      attendanceId: session.attendanceId,
      member: session.memberId,
      attendanceDateKey: session.attendanceDateKey,
      checkInTime: session.checkInTime,
      checkInMethod: session.checkInMethod,
      currentDurationMinutes,
      isManual: session.isManual ?? false,
      status: 'INSIDE',
    };
  });

  return {
    liveAttendance: liveMembers,
    summary: {
      currentlyInside: totalRecords,
    },
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
    generatedAt: now,
  };
};


export const createManualAttendance = async (
  data: {
    memberId: string;
    attendanceDateKey: string;
    checkInTime: string;
    checkOutTime: string;
    reason: string;
  },
  actor: AttendanceActor,
) => {
  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('A valid authenticated user is required.', 403);
  }

  if (!mongoose.isValidObjectId(data.memberId)) {
    return fail('A valid member ID is required.', 400);
  }

  if (!isValidDateKey(data.attendanceDateKey)) {
    return fail('Invalid attendance date.', 400);
  }

  if (!data.reason?.trim() || data.reason.trim().length < 5) {
    return fail('A manual attendance reason of at least 5 characters is required.', 400);
  }

  const todayKey = getIndiaDateKey();

  if (data.attendanceDateKey >= todayKey) {
    return fail('Manual attendance is allowed only for past dates.', 400);
  }

  const checkInTime = new Date(data.checkInTime);
  const checkOutTime = new Date(data.checkOutTime);

  if (
    Number.isNaN(checkInTime.getTime()) ||
    Number.isNaN(checkOutTime.getTime())
  ) {
    return fail('Valid check-in and check-out times are required.', 400);
  }

  if (
    getIndiaDateKey(checkInTime) !== data.attendanceDateKey ||
    getIndiaDateKey(checkOutTime) !== data.attendanceDateKey
  ) {
    return fail(
      'Check-in and check-out must belong to the selected India calendar date.',
      400,
    );
  }

  validateCheckoutTime(checkInTime, checkOutTime);

  const branchId = new mongoose.Types.ObjectId(actor.branchId);

  const member = await Member.findOne({
    _id: data.memberId,
    branchId,
  });

  if (!member) {
    return fail('Member not found in your assigned branch.', 404);
  }

  const { start, end } = getIndiaDayBounds(data.attendanceDateKey);

  // Validate that the member had a membership covering this date.
  // Historical membership status may now be expired.
  const membership = await Membership.findOne({
    memberId: member._id,
    branchId,
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  if (!membership) {
    return fail(
      'No membership record covers the selected attendance date.',
      403,
    );
  }

  // Prevent a manual historical entry from overlapping an existing
  // session for the same member on the selected date.
  const existingSessions = await AttendanceLog.find({
    memberId: member._id,
    branchId,
    attendanceDateKey: data.attendanceDateKey,
    attendanceStatus: { $ne: AttendanceStatus.VOIDED },
  }).select('checkInTime checkOutTime attendanceStatus');

  const overlaps = existingSessions.some((session) => {
    const existingStart = new Date(session.checkInTime).getTime();
    const existingEnd = session.checkOutTime
      ? new Date(session.checkOutTime).getTime()
      : Number.POSITIVE_INFINITY;

    return (
      checkInTime.getTime() < existingEnd &&
      checkOutTime.getTime() > existingStart
    );
  });

  if (overlaps) {
    return fail(
      'This manual visit overlaps an existing attendance session.',
      409,
    );
  }

  const durationMinutes = calculateDurationMinutes(
    checkInTime,
    checkOutTime,
  );

  const mongoSession = await mongoose.startSession();

  let createdAttendance: any;

  try {
    await mongoSession.withTransaction(async () => {
      const [attendance] = await AttendanceLog.create(
        [
          {
            memberId: member._id,
            branchId,
            attendanceDateKey: data.attendanceDateKey,
            checkInTime,
            checkInMethod: AttendanceMethod.MANUAL,
            checkOutTime,
            checkOutMethod: AttendanceMethod.MANUAL,
            attendanceStatus: AttendanceStatus.CHECKED_OUT,
            durationMinutes,
            isManual: true,
            manualReason: data.reason.trim(),
            voidedAt: null,
            voidedBy: null,
            voidReason: null,
          },
        ],
        { session: mongoSession },
      );

      await AttendanceAuditLog.create(
        [
          {
            attendanceId: attendance._id,
            memberId: member._id,
            branchId,
            action: AttendanceAuditAction.MANUAL_CREATED,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            performedByRole: 'BRANCH_ADMIN',
            reason: data.reason.trim(),
            before: null,
            after: {
              attendanceDateKey: data.attendanceDateKey,
              checkInTime,
              checkOutTime,
              checkInMethod: AttendanceMethod.MANUAL,
              checkOutMethod: AttendanceMethod.MANUAL,
              attendanceStatus: AttendanceStatus.CHECKED_OUT,
              durationMinutes,
              isManual: true,
            },
          },
        ],
        { session: mongoSession },
      );

      createdAttendance = attendance;
    });
  } finally {
    await mongoSession.endSession();
  }

  return {
    attendance: createdAttendance,
    member: {
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`,
    },
    message: 'Past manual attendance created successfully.',
  };
};


export const updateAttendance = async (
  attendanceId: string,
  data: {
    checkInTime?: string;
    checkOutTime?: string;
    reason: string;
  },
  actor: AttendanceActor,
) => {
  if (!mongoose.isValidObjectId(attendanceId)) {
    return fail('A valid attendance ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('A valid authenticated user is required.', 403);
  }

  if (!data.reason?.trim() || data.reason.trim().length < 5) {
    return fail('A correction reason of at least 5 characters is required.', 400);
  }

  const branchId = new mongoose.Types.ObjectId(actor.branchId);
  const mongoSession = await mongoose.startSession();

  let updatedAttendance: any;

  try {
    await mongoSession.withTransaction(async () => {
      const attendance = await AttendanceLog.findOne({
        _id: attendanceId,
        branchId,
      }).session(mongoSession);

     if (!attendance) {
  throw Object.assign(
    new Error('Attendance record not found in your branch.'),
    { statusCode: 404 },
  );
}

      if (attendance.attendanceStatus === AttendanceStatus.VOIDED) {
        fail('Voided attendance records cannot be edited.', 409);
      }

      const before = {
        attendanceDateKey: attendance.attendanceDateKey,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        attendanceStatus: attendance.attendanceStatus,
        durationMinutes: attendance.durationMinutes,
        isManual: attendance.isManual,
      };

      const nextCheckIn = data.checkInTime
        ? new Date(data.checkInTime)
        : new Date(attendance.checkInTime);

      const nextCheckOut = data.checkOutTime !== undefined
        ? new Date(data.checkOutTime)
        : attendance.checkOutTime
          ? new Date(attendance.checkOutTime)
          : null;

      if (Number.isNaN(nextCheckIn.getTime())) {
        fail('Invalid check-in time.', 400);
      }

      if (
        getIndiaDateKey(nextCheckIn) !== attendance.attendanceDateKey
      ) {
        fail('Corrected check-in must remain on the original attendance date.', 400);
      }

      if (nextCheckOut) {
        if (Number.isNaN(nextCheckOut.getTime())) {
          fail('Invalid check-out time.', 400);
        }

        if (
          getIndiaDateKey(nextCheckOut) !== attendance.attendanceDateKey
        ) {
          fail('Corrected check-out must remain on the original attendance date.', 400);
        }

        validateCheckoutTime(nextCheckIn, nextCheckOut);
      }

      // Prevent overlap with another non-voided session.
      const otherSessions = await AttendanceLog.find({
        _id: { $ne: attendance._id },
        memberId: attendance.memberId,
        branchId,
        attendanceDateKey: attendance.attendanceDateKey,
        attendanceStatus: { $ne: AttendanceStatus.VOIDED },
      })
        .select('checkInTime checkOutTime')
        .session(mongoSession);

      const nextStart = nextCheckIn.getTime();
      const nextEnd = nextCheckOut
        ? nextCheckOut.getTime()
        : Number.POSITIVE_INFINITY;

      const overlaps = otherSessions.some((session) => {
        const existingStart = new Date(session.checkInTime).getTime();
        const existingEnd = session.checkOutTime
          ? new Date(session.checkOutTime).getTime()
          : Number.POSITIVE_INFINITY;

        return nextStart < existingEnd && nextEnd > existingStart;
      });

      if (overlaps) {
        fail('Corrected attendance overlaps another session.', 409);
      }

      attendance.checkInTime = nextCheckIn;

      if (data.checkInTime) {
        attendance.checkInMethod = AttendanceMethod.MANUAL;
      }

      if (data.checkOutTime !== undefined) {
        attendance.checkOutTime = nextCheckOut;
        attendance.checkOutMethod = nextCheckOut
          ? AttendanceMethod.MANUAL
          : null;
      }

      if (attendance.checkOutTime) {
        attendance.attendanceStatus = AttendanceStatus.CHECKED_OUT;
        attendance.durationMinutes = calculateDurationMinutes(
          new Date(attendance.checkInTime),
          new Date(attendance.checkOutTime),
        );
      } else {
        attendance.attendanceStatus = AttendanceStatus.CHECKED_IN;
        attendance.durationMinutes = null;
      }

      attendance.isManual = true;
      attendance.manualReason = data.reason.trim();

      await attendance.save({ session: mongoSession });

      const after = {
        attendanceDateKey: attendance.attendanceDateKey,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        attendanceStatus: attendance.attendanceStatus,
        durationMinutes: attendance.durationMinutes,
        isManual: attendance.isManual,
      };

      await AttendanceAuditLog.create(
        [
          {
            attendanceId: attendance._id,
            memberId: attendance.memberId,
            branchId,
            action: AttendanceAuditAction.UPDATED,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            performedByRole: 'BRANCH_ADMIN',
            reason: data.reason.trim(),
            before,
            after,
          },
        ],
        { session: mongoSession },
      );

      updatedAttendance = attendance;
    });
  } finally {
    await mongoSession.endSession();
  }

  return {
    attendance: updatedAttendance,
    message: 'Attendance updated successfully.',
  };
};


export const voidAttendance = async (
  attendanceId: string,
  reason: string,
  actor: AttendanceActor,
) => {
  if (!mongoose.isValidObjectId(attendanceId)) {
    return fail('A valid attendance ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('A valid authenticated user is required.', 403);
  }

  if (!reason?.trim() || reason.trim().length < 5) {
    return fail('A void reason of at least 5 characters is required.', 400);
  }

  const branchId = new mongoose.Types.ObjectId(actor.branchId);
  const mongoSession = await mongoose.startSession();

  let voidedAttendance: any;

  try {
    await mongoSession.withTransaction(async () => {
      const attendance = await AttendanceLog.findOne({
        _id: attendanceId,
        branchId,
      }).session(mongoSession);

      if (!attendance) {
  throw Object.assign(
    new Error('Attendance record not found in your branch.'),
    { statusCode: 404 },
  );
}

      if (attendance.attendanceStatus === AttendanceStatus.VOIDED) {
        fail('This attendance record is already voided.', 409);
      }

      const before = {
        attendanceDateKey: attendance.attendanceDateKey,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        attendanceStatus: attendance.attendanceStatus,
        durationMinutes: attendance.durationMinutes,
        isManual: attendance.isManual,
      };

      const now = new Date();

      attendance.attendanceStatus = AttendanceStatus.VOIDED;
      attendance.voidedAt = now;
      attendance.voidedBy = new mongoose.Types.ObjectId(actor.userId);
      attendance.voidReason = reason.trim();

      await attendance.save({ session: mongoSession });

      const after = {
        attendanceDateKey: attendance.attendanceDateKey,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        attendanceStatus: attendance.attendanceStatus,
        durationMinutes: attendance.durationMinutes,
        isManual: attendance.isManual,
      };

      await AttendanceAuditLog.create(
        [
          {
            attendanceId: attendance._id,
            memberId: attendance.memberId,
            branchId,
            action: AttendanceAuditAction.VOIDED,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            performedByRole: 'BRANCH_ADMIN',
            reason: reason.trim(),
            before,
            after,
          },
        ],
        { session: mongoSession },
      );

      voidedAttendance = attendance;
    });
  } finally {
    await mongoSession.endSession();
  }

  return {
    attendance: voidedAttendance,
    message: 'Attendance voided successfully.',
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



/**
 * Get Attendance Audit History
 *
 * Features:
 * 1. Branch ownership validation
 * 2. Attendance record validation
 * 3. Audit history with before/after snapshots
 * 4. Pagination
 * 5. Latest changes first
 */
export const getAttendanceAuditHistory = async (
  attendanceId: string,
  actor: AttendanceActor,
  filters: {
    page?: number;
    limit?: number;
  },
) => {
  if (!attendanceId || !mongoose.isValidObjectId(attendanceId)) {
    return fail('A valid attendance ID is required.', 400);
  }

  if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
    return fail('A valid assigned branch is required.', 403);
  }

  const branchId = new mongoose.Types.ObjectId(actor.branchId);

  // Verify that the attendance belongs to the admin's branch.
  const attendance = await AttendanceLog.findOne({
    _id: attendanceId,
    branchId,
  }).lean();

  if (!attendance) {
    return fail('Attendance record not found in your branch.', 404);
  }

  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(filters.limit || 10)),
  );

  const skip = (page - 1) * limit;

  const query = {
    attendanceId: attendance._id,
    branchId,
  };

  const [auditLogs, totalRecords] = await Promise.all([
    AttendanceAuditLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'firstName lastName email')
      .lean(),

    AttendanceAuditLog.countDocuments(query),
  ]);

  return {
    attendance,
    auditHistory: auditLogs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

