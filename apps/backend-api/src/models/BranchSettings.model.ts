
import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchSettings extends Document {
  branchId: mongoose.Types.ObjectId;
  timezone: string;
  currency: string;

  // Maximum cumulative freeze allowance per membership.
  maxFreezeDays: number;

  workingHours: {
    start: string;
    end: string;
  };

  attendanceWindow: {
    checkInStart: string;
    checkInEnd: string;
    checkOutStart: string;
    checkOutEnd: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const branchSettingsSchema = new Schema<IBranchSettings>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      unique: true,
    },

    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },

    currency: {
      type: String,
      required: true,
      default: 'INR',
    },

    maxFreezeDays: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
      max: 30,
    },

    workingHours: {
      start: {
        type: String,
        required: true,
        default: '09:00',
      },
      end: {
        type: String,
        required: true,
        default: '18:00',
      },
    },

    attendanceWindow: {
      checkInStart: {
        type: String,
        required: true,
        default: '08:00',
      },
      checkInEnd: {
        type: String,
        required: true,
        default: '11:00',
      },
      checkOutStart: {
        type: String,
        required: true,
        default: '16:00',
      },
      checkOutEnd: {
        type: String,
        required: true,
        default: '23:00',
      },
    },
  },
  {
    timestamps: true,
  },
);

export const BranchSettings = mongoose.model<IBranchSettings>(
  'BranchSettings',
  branchSettingsSchema,
);
