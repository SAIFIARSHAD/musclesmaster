import mongoose, { Schema, Document } from 'mongoose';

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MemberGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface IMember extends Document {
  userId: mongoose.Types.ObjectId;
  memberId: string;

  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: Date;
  mobile: string;
  email?: string;
  address?: string;

  branchId: mongoose.Types.ObjectId;

  membershipPlan?: mongoose.Types.ObjectId | null;
  startDate?: Date;
  endDate?: Date;

  trainerId?: mongoose.Types.ObjectId | null;

  status: MemberStatus;

  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    memberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: Object.values(MemberGender),
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },

    membershipPlan: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    trainerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(MemberStatus),
      default: MemberStatus.INACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Same mobile number cannot be registered twice
// within the same branch.
memberSchema.index(
  { branchId: 1, mobile: 1 },
  { unique: true },
);

memberSchema.index({ branchId: 1, status: 1 });
memberSchema.index({ branchId: 1, memberId: 1 });
memberSchema.index({ trainerId: 1 });

export const Member = mongoose.model<IMember>(
  'Member',
  memberSchema,
);
