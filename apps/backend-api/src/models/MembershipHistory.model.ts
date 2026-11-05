import mongoose, { Schema, Document } from 'mongoose';

export enum MembershipHistoryAction {
  ASSIGNED = 'ASSIGNED',
  ACTIVATED = 'ACTIVATED',
  RENEWED = 'RENEWED',
  FROZEN = 'FROZEN',
  UNFROZEN = 'UNFROZEN',
  EXPIRED = 'EXPIRED',
  REPLACED = 'REPLACED',
}

export interface IMembershipHistory extends Document {
  membershipId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  action: MembershipHistoryAction;

  previousStatus?: string;
  newStatus?: string;

  performedBy: mongoose.Types.ObjectId;

  notes?: string;
  metadata?: Record<string, unknown>;

  createdAt: Date;
}

const membershipHistorySchema = new Schema<IMembershipHistory>(
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

    action: {
      type: String,
      enum: Object.values(MembershipHistoryAction),
      required: true,
    },

    previousStatus: {
      type: String,
    },

    newStatus: {
      type: String,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

membershipHistorySchema.index({ membershipId: 1, createdAt: -1 });
membershipHistorySchema.index({ memberId: 1, createdAt: -1 });
membershipHistorySchema.index({ branchId: 1, createdAt: -1 });

export const MembershipHistory = mongoose.model<IMembershipHistory>(
  'MembershipHistory',
  membershipHistorySchema,
);