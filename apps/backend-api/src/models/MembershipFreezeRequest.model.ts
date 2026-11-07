import mongoose, { Schema, Document } from 'mongoose';

export enum FreezeRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface IMembershipFreezeRequest extends Document {
  membershipId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  requestedDays: number;
  reason: string;
  status: FreezeRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const membershipFreezeRequestSchema =
  new Schema<IMembershipFreezeRequest>(
    {
      membershipId: {
        type: Schema.Types.ObjectId,
        ref: 'Membership',
        required: true,
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
      requestedDays: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
      },
      reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
      status: {
        type: String,
        enum: Object.values(FreezeRequestStatus),
        default: FreezeRequestStatus.PENDING,
        required: true,
      },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
      reviewNotes: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },
    { timestamps: true }
  );

membershipFreezeRequestSchema.index(
  { membershipId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: FreezeRequestStatus.PENDING,
    },
  },
);

membershipFreezeRequestSchema.index({
  branchId: 1,
  status: 1,
  createdAt: -1,
});

membershipFreezeRequestSchema.index({
  memberId: 1,
  createdAt: -1,
});

export const MembershipFreezeRequest = mongoose.model<IMembershipFreezeRequest>(
  'MembershipFreezeRequest',
  membershipFreezeRequestSchema
);