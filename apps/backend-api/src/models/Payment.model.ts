
import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export enum PaymentType {
  MEMBERSHIP = 'MEMBERSHIP',
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

export interface IPayment extends Document {
  paymentReference: string;
  idempotencyKey?: string;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  membershipId?: mongoose.Types.ObjectId | null;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      trim: true,
    },

    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
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

    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      default: null,
    },

    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },

    // Amount collected in this individual transaction
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ branchId: 1, createdAt: -1 });
paymentSchema.index({ memberId: 1, createdAt: -1 });
paymentSchema.index({ branchId: 1, status: 1 });
paymentSchema.index({ membershipId: 1, status: 1 });

export const Payment = mongoose.model<IPayment>(
  'Payment',
  paymentSchema,
);
