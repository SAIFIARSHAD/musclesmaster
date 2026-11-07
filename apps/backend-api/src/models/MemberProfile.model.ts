import mongoose, { Schema, Document } from 'mongoose';

export interface IMemberProfile extends Document {
  memberId: mongoose.Types.ObjectId;

  height?: number;
  weight?: number;
  bmi?: number;

  fitnessGoal?: string;
  medicalConditions: string[];

  createdAt: Date;
  updatedAt: Date;
}

const memberProfileSchema = new Schema<IMemberProfile>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
    },

    height: {
      type: Number,
      min: 1,
    },

    weight: {
      type: Number,
      min: 1,
    },

    bmi: {
      type: Number,
      min: 0,
    },

    fitnessGoal: {
      type: String,
      trim: true,
    },

    medicalConditions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const MemberProfile = mongoose.model<IMemberProfile>(
  'MemberProfile',
  memberProfileSchema,
);
