
import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export enum AttendanceStatus {
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
}

export enum AttendanceMethod {
  QR = 'QR',
  MANUAL = 'MANUAL',
}

export interface IAttendanceLog extends Document {
  attendanceId: string;

  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  attendanceDateKey: string;

  checkInTime: Date;
  checkInMethod: AttendanceMethod;

  checkOutTime?: Date | null;
  checkOutMethod?: AttendanceMethod | null;

  attendanceStatus: AttendanceStatus;

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
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },

    attendanceDateKey: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  },
);

// Member attendance history index
attendanceLogSchema.index({
  memberId: 1,
  checkInTime: -1,
});

// Branch attendance history index
attendanceLogSchema.index({
  branchId: 1,
  checkInTime: -1,
});

// Attendance status index
attendanceLogSchema.index({
  attendanceStatus: 1,
  checkInTime: -1,
});

// Prevent duplicate daily attendance for a member
attendanceLogSchema.index(
  { memberId: 1, attendanceDateKey: 1 },
  {
    unique: true,
    name: 'unique_member_daily_attendance',
  },
);

export const AttendanceLog = mongoose.model<IAttendanceLog>(
  'AttendanceLog',
  attendanceLogSchema,
);
