import crypto from 'crypto';
import { User } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateOtp, hashOtp } from '../utils/otp';

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    await AuditLog.create({
      email,
      action: 'LOGIN',
      status: 'FAILED',
      reason: 'User not found',
    });
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    await AuditLog.create({
      email,
      action: 'LOGIN',
      status: 'FAILED',
      reason: 'Account deactivated',
    });
    throw new Error('Account is deactivated. Contact administrator.');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await AuditLog.create({
      email,
      action: 'LOGIN',
      status: 'FAILED',
      reason: 'Incorrect password',
    });
    throw new Error('Invalid email or password');
  }

  await AuditLog.create({
    email,
    action: 'LOGIN',
    status: 'SUCCESS',
  });

  const payload = {
    userId: String(user._id),
    role: user.role,
    branchId: user.branchId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    },
  };
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error('No account found with this email');
  }

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);

  return { email: user.email };
};

export const verifyResetOtp = async (email: string, otp: string) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    resetOtpExpiry: { $gt: new Date() },
  });

  if (!user || !user.resetOtp) {
    throw new Error('Invalid or expired OTP');
  }

  const hashedInputOtp = hashOtp(otp);
  if (hashedInputOtp !== user.resetOtp) {
    throw new Error('Invalid or expired OTP');
  }

  const verifiedToken = crypto.randomBytes(32).toString('hex');
  user.resetVerifiedToken = verifiedToken;
  user.resetVerifiedTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  return { verifiedToken };
};

export const resetPassword = async (verifiedToken: string, newPassword: string) => {
  const user = await User.findOne({
    resetVerifiedToken: verifiedToken,
    resetVerifiedTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired session. Please verify OTP again.');
  }

  user.password = newPassword;
  user.resetVerifiedToken = undefined;
  user.resetVerifiedTokenExpiry = undefined;
  await user.save();

  return { email: user.email };
};