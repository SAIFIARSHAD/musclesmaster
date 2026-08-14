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
  createdAt: Date;
  updatedAt: Date;
  resetOtp?: string;
resetOtpExpiry?: Date;
resetVerifiedToken?: string;
resetVerifiedTokenExpiry?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}