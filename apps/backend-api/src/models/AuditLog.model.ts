import mongoose, { Schema, Document } from 'mongoose';

export type AuditStatus = 'SUCCESS' | 'FAILED';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  action: string;
  status: AuditStatus;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    reason: {
      type: String,
      required: false,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>(
  'AuditLog',
  auditLogSchema
);
