import mongoose, { Schema, Document } from 'mongoose';
export interface IBranch extends Document {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  managerId?: mongoose.Types.ObjectId | null;
  gstNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    managerName: { type: String, trim: true },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gstNumber: { type: String, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

branchSchema.index({ name: 1 });
branchSchema.index({ city: 1 });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);