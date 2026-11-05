import mongoose, { Schema, Document } from 'mongoose';

export enum MembershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FROZEN = 'FROZEN',
}

export interface IMembership extends Document {
  memberId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  paymentId?: mongoose.Types.ObjectId | null;

  startDate: Date;
  endDate: Date;

  status: MembershipStatus;

  freezeDays: number;
  frozenAt?: Date;
  freezeEndDate?: Date;

  activatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.PENDING,
      required: true,
    },

    freezeDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    frozenAt: {
      type: Date,
    },

    freezeEndDate: {
      type: Date,
    },

    activatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

membershipSchema.index({ memberId: 1, status: 1 });
membershipSchema.index({ branchId: 1, status: 1 });
membershipSchema.index({ endDate: 1, status: 1 });
membershipSchema.index({ planId: 1 });

export const Membership = mongoose.model<IMembership>(
  'Membership',
  membershipSchema,
);