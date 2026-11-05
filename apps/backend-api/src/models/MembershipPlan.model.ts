import mongoose, { Schema, Document } from 'mongoose';

export enum MembershipPlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MembershipPlanType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  ANNUAL = 'ANNUAL',
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  PREMIUM = 'PREMIUM',
  CORPORATE = 'CORPORATE',
}

export interface IMembershipPlan extends Document {
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded: boolean;
  status: MembershipPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    planName: {
      type: String,
      required: true,
      trim: true,
    },

    planType: {
      type: String,
      enum: Object.values(MembershipPlanType),
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0.01,
    },

    description: {
      type: String,
      trim: true,
    },

    ptIncluded: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: Object.values(MembershipPlanStatus),
      default: MembershipPlanStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

membershipPlanSchema.index({ status: 1 });
membershipPlanSchema.index({ planType: 1 });

export const MembershipPlan = mongoose.model<IMembershipPlan>(
  'MembershipPlan',
  membershipPlanSchema,
);