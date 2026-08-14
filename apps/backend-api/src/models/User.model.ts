import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.types';
import { UserRole } from '../constants/roles.enum';
import { hashPassword, comparePassword } from '../utils/hashPassword';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    mobile: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.MEMBER,
    },
    branchId: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
resetOtp: {
  type: String,
  required: false,
},
resetOtpExpiry: {
  type: Date,
  required: false,
},
resetVerifiedToken: {
  type: String,
  required: false,
},
resetVerifiedTokenExpiry: {
  type: Date,
  required: false,
},

  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);