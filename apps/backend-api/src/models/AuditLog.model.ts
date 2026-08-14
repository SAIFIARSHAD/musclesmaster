import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  email: string;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  reason?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    email: { type: String, required: true },
    action: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    ipAddress: { type: String },
    reason: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);