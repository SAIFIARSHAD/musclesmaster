import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface IRefund extends Document {
  refundReference: string;
  idempotencyKey?: string;

  paymentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId | null;

  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  refundAmount: number;
  reason: string;

  status: RefundStatus;

  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId | null;
  rejectedBy?: mongoose.Types.ObjectId | null;
  rejectedAt?: Date | null;

  approvalNote?: string;

  refundTransactionId?: string;

  requestedAt: Date;
  approvedAt?: Date | null;
  processedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    refundReference: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      immutable: true,
      trim: true,
    },

    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      immutable: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      immutable: true,
    },

    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
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

    refundAmount: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      required: true,
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },


    rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    },

    rejectedAt: {
    type: Date,
    default: null,
  },

    approvalNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    refundTransactionId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Payment-wise refund history.
refundSchema.index({
  paymentId: 1,
  createdAt: -1,
});

// Branch-wise refund requests.
refundSchema.index({
  branchId: 1,
  status: 1,
  createdAt: -1,
});

// Member-wise refund history.
refundSchema.index({
  memberId: 1,
  createdAt: -1,
});

export const Refund = mongoose.model<IRefund>(
  'Refund',
  refundSchema,
);
