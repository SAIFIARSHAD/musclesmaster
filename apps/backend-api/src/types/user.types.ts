import { Document } from 'mongoose';
import { UserRole } from '../constants/roles.enum';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;

  resetOtp?: string;
  resetOtpExpiry?: Date;
  resetVerifiedToken?: string;
  resetVerifiedTokenExpiry?: Date;

  failedLoginAttempts: number;
  lockUntil?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}