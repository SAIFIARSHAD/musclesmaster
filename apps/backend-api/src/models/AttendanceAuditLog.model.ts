
import mongoose, { Schema, Document } from 'mongoose';

// Actions that can modify attendance records.
export enum AttendanceAuditAction {
  CREATED = 'CREATED',
  MANUAL_CREATED = 'MANUAL_CREATED',
  UPDATED = 'UPDATED',
  VOIDED = 'VOIDED',
}

// Snapshot of attendance values before or after modification.
export interface IAttendanceSnapshot {
  attendanceDateKey: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  checkInMethod: string | null;
  checkOutMethod: string | null;
  attendanceStatus: string;
  durationMinutes: number | null;
  isManual: boolean;
}

// Audit history document.
export interface IAttendanceAuditLog extends Document {
  attendanceId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  action: AttendanceAuditAction;

  performedBy: mongoose.Types.ObjectId;
  performedByRole: string;

  reason?: string | null;

  before: IAttendanceSnapshot | null;
  after: IAttendanceSnapshot | null;

  createdAt: Date;
}

const attendanceSnapshotSchema = new Schema<IAttendanceSnapshot>(
  {
    attendanceDateKey: {
      type: String,
      required: true,
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    checkInMethod: {
      type: String,
      default: null,
    },

    checkOutMethod: {
      type: String,
      default: null,
    },

    attendanceStatus: {
      type: String,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: null,
    },

    isManual: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const attendanceAuditLogSchema = new Schema<IAttendanceAuditLog>(
  {
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceLog',
      required: true,
      index: true,
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

    action: {
      type: String,
      enum: Object.values(AttendanceAuditAction),
      required: true,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    performedByRole: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    before: {
      type: attendanceSnapshotSchema,
      default: null,
    },

    after: {
      type: attendanceSnapshotSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Efficient branch-wise audit history.
attendanceAuditLogSchema.index({
  branchId: 1,
  createdAt: -1,
});

// Efficient member-wise audit history.
attendanceAuditLogSchema.index({
  memberId: 1,
  createdAt: -1,
});

export const AttendanceAuditLog = mongoose.model<IAttendanceAuditLog>(
  'AttendanceAuditLog',
  attendanceAuditLogSchema,
);
