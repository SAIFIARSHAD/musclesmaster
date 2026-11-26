import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

// Attendance session lifecycle.
export enum AttendanceStatus {
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
  VOIDED = 'voided',
}

// How the member's attendance was recorded.
export enum AttendanceMethod {
  QR = 'QR',
  MANUAL = 'MANUAL',
}

export interface IAttendanceLog extends Document {
  attendanceId: string;

  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  // India calendar date: YYYY-MM-DD
  attendanceDateKey: string;

  checkInTime: Date;
  checkInMethod: AttendanceMethod;

  checkOutTime?: Date | null;
  checkOutMethod?: AttendanceMethod | null;

  attendanceStatus: AttendanceStatus;

  // Calculated session duration in minutes.
  durationMinutes: number | null;

  // Manual attendance information.
  isManual: boolean;
  manualReason?: string | null;

  // Void / cancellation information.
  voidedAt?: Date | null;
  voidedBy?: mongoose.Types.ObjectId | null;
  voidReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const attendanceLogSchema = new Schema<IAttendanceLog>(
  {
    attendanceId: {
      type: String,
      unique: true,
      required: true,
      default: () => randomUUID(),
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },

    attendanceDateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    checkInTime: {
      type: Date,
      required: true,
    },

    checkInMethod: {
      type: String,
      enum: Object.values(AttendanceMethod),
      required: true,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    checkOutMethod: {
      type: String,
      enum: Object.values(AttendanceMethod),
      default: null,
    },

    attendanceStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.CHECKED_IN,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: null,
      min: 0,
    },

    isManual: {
      type: Boolean,
      default: false,
    },

    manualReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    voidedAt: {
      type: Date,
      default: null,
    },

    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    voidReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Member's attendance history.
attendanceLogSchema.index({
  memberId: 1,
  attendanceDateKey: -1,
  checkInTime: -1,
});

// Branch's daily attendance.
attendanceLogSchema.index({
  branchId: 1,
  attendanceDateKey: -1,
});

// Branch's live attendance.
attendanceLogSchema.index({
  branchId: 1,
  attendanceStatus: 1,
  checkInTime: -1,
});

// Reports and date-wise session queries.
attendanceLogSchema.index({
  branchId: 1,
  attendanceDateKey: 1,
  attendanceStatus: 1,
});

// Prevent multiple simultaneous open sessions for one member.
// A member can still have multiple completed sessions on the same day.
attendanceLogSchema.index(
  { memberId: 1 },
  {
    unique: true,
    name: 'unique_member_open_attendance_session',
    partialFilterExpression: {
      attendanceStatus: AttendanceStatus.CHECKED_IN,
    },
  },
);

export const AttendanceLog = mongoose.model<IAttendanceLog>(
  'AttendanceLog',
  attendanceLogSchema,
);
