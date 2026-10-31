
import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    userAgent: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>(
  'Session',
  sessionSchema
);
