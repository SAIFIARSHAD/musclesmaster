import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentAuditAction {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUND_APPROVED = 'REFUND_APPROVED',
  REFUND_REJECTED = 'REFUND_REJECTED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
}

export interface IPaymentAudit extends Document {
  paymentId: mongoose.Types.ObjectId;
  refundId?: mongoose.Types.ObjectId | null;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  action: PaymentAuditAction;

  performedBy: mongoose.Types.ObjectId;

  previousStatus?: string;
  newStatus?: string;

  amount?: number;
  notes?: string;

  metadata?: Record<string, unknown>;

  createdAt: Date;
}

const paymentAuditSchema = new Schema<IPaymentAudit>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      immutable: true,
    },

    refundId: {
      type: Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
      immutable: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      immutable: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      immutable: true,
    },

    action: {
      type: String,
      enum: Object.values(PaymentAuditAction),
      required: true,
      immutable: true,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },

    previousStatus: {
      type: String,
      default: null,
      immutable: true,
    },

    newStatus: {
      type: String,
      default: null,
      immutable: true,
    },

    amount: {
      type: Number,
      min: 0,
      immutable: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      immutable: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

paymentAuditSchema.index(
  { paymentId: 1, createdAt: -1 },
  { name: 'payment_audit_history' },
);

paymentAuditSchema.index(
  { branchId: 1, createdAt: -1 },
  { name: 'branch_payment_audit_history' },
);

paymentAuditSchema.index(
  { memberId: 1, createdAt: -1 },
  { name: 'member_payment_audit_history' },
);

paymentAuditSchema.index(
  { refundId: 1, createdAt: -1 },
  { name: 'refund_audit_history' },
);

export const PaymentAudit = mongoose.model<IPaymentAudit>(
  'PaymentAudit',
  paymentAuditSchema,
);
