
import crypto from 'crypto';
import mongoose from 'mongoose';

import { User } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { generateOtp, hashOtp } from '../utils/otp';
import { sendEmail } from './email.service';
import { resetPasswordEmailTemplate } from '../templates/resetPasswordEmail';
import { createSession, revokeAllUserSessions } from './session.service';

type LoginMeta = {
  userAgent?: string;
  ipAddress?: string;
};

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

const getUserResponse = (user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  branchId?: string;
}) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  branchId: user.branchId,
});

/**
 * Audit logging must not interrupt the primary security operation.
 * Never pass passwords, OTPs, refresh tokens or reset tokens to this helper.
 */
const writeAuditLog = async (
  data: {
    userId?: string;
    email: string;
    action: string;
    status: 'SUCCESS' | 'FAILED';
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }
): Promise<void> => {
  try {
    const validUserId =
      data.userId && mongoose.isValidObjectId(data.userId)
        ? new mongoose.Types.ObjectId(data.userId)
        : undefined;

    await AuditLog.create({
      ...(validUserId ? { userId: validUserId } : {}),
      email: data.email.trim().toLowerCase(),
      action: data.action,
      status: data.status,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      reason: data.reason?.slice(0, 500),
    });
  } catch {
    console.error(`Failed to record audit event: ${data.action}`);
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const loginUser = async (
  email: string,
  password: string,
  meta: LoginMeta = {}
) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    await writeAuditLog({
      email: normalizedEmail,
      action: 'LOGIN',
      status: 'FAILED',
      ...meta,
      reason: 'User not found',
    });

    throw Object.assign(new Error('Invalid email or password'), {
      statusCode: 401,
    });
  }

  if (!user.isActive) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'LOGIN',
      status: 'FAILED',
      ...meta,
      reason: 'Account deactivated',
    });

    throw Object.assign(
      new Error('Account is deactivated. Contact administrator.'),
      { statusCode: 401 }
    );
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'LOGIN',
      status: 'FAILED',
      ...meta,
      reason: 'Account temporarily locked',
    });

    throw Object.assign(
      new Error('Account is temporarily locked. Please try again after 15 minutes.'),
      { statusCode: 423 }
    );
  }

  if (user.lockUntil && user.lockUntil <= new Date()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = attempts;

    let message = 'Invalid email or password';
    let reason = 'Incorrect password';
    let statusCode = 401;

    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      user.failedLoginAttempts = 0;
      message = 'Too many failed login attempts. Account is locked for 15 minutes.';
      reason = 'Account locked after 5 failed login attempts';
      statusCode = 423;
    }

    await user.save();

    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'LOGIN',
      status: 'FAILED',
      ...meta,
      reason,
    });

    throw Object.assign(new Error(message), { statusCode });
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  const { accessToken, refreshToken } = await createSession(user, meta);

  await writeAuditLog({
    userId: String(user._id),
    email: user.email,
    action: 'LOGIN',
    status: 'SUCCESS',
    ...meta,
  });

  return {
    accessToken,
    refreshToken,
    user: getUserResponse(user),
  };
};

export const forgotPassword = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  // Keep the public response generic to avoid exposing account existence.
  if (!user) {
    await writeAuditLog({
      email: normalizedEmail,
      action: 'PASSWORD_RESET_REQUEST',
      status: 'FAILED',
      reason: 'No matching account',
    });

    return { email: normalizedEmail };
  }

  if (!user.isActive) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'PASSWORD_RESET_REQUEST',
      status: 'FAILED',
      reason: 'Account deactivated',
    });

    // Keep the outward response generic.
    return { email: normalizedEmail };
  }

  const otp = generateOtp();

  user.resetOtp = hashOtp(otp);
  user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  user.resetVerifiedToken = undefined;
  user.resetVerifiedTokenExpiry = undefined;
  await user.save();

  const { subject, html } = resetPasswordEmailTemplate(user.name, otp);

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
  } catch {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'PASSWORD_RESET_REQUEST',
      status: 'FAILED',
      reason: 'Reset email delivery failed',
    });

    throw new Error('Unable to send reset OTP. Please try again.');
  }

  await writeAuditLog({
    userId: String(user._id),
    email: user.email,
    action: 'PASSWORD_RESET_REQUEST',
    status: 'SUCCESS',
  });

  // Do not log OTP values, even in development.
  return { email: user.email };
};

export const verifyResetOtp = async (email: string, otp: string) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    resetOtpExpiry: { $gt: new Date() },
  });

  if (!user || !user.resetOtp) {
    await writeAuditLog({
      email: normalizedEmail,
      action: 'OTP_VERIFY',
      status: 'FAILED',
      reason: 'Invalid or expired OTP',
    });

    throw new Error('Invalid or expired OTP');
  }

  const hashedInputOtp = hashOtp(otp);

  const storedOtp = Buffer.from(user.resetOtp, 'utf8');
  const submittedOtp = Buffer.from(hashedInputOtp, 'utf8');

  const otpMatches =
    storedOtp.length === submittedOtp.length &&
    crypto.timingSafeEqual(storedOtp, submittedOtp);

  if (!otpMatches) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'OTP_VERIFY',
      status: 'FAILED',
      reason: 'Invalid OTP',
    });

    throw new Error('Invalid or expired OTP');
  }

  const verifiedToken = crypto.randomBytes(32).toString('hex');

  user.resetVerifiedToken = verifiedToken;
  user.resetVerifiedTokenExpiry = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MS
  );
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  await writeAuditLog({
    userId: String(user._id),
    email: user.email,
    action: 'OTP_VERIFY',
    status: 'SUCCESS',
  });

  return { verifiedToken };
};

export const resetPassword = async (
  verifiedToken: string,
  newPassword: string
) => {
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
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  await revokeAllUserSessions(String(user._id));

  await writeAuditLog({
    userId: String(user._id),
    email: user.email,
    action: 'PASSWORD_RESET',
    status: 'SUCCESS',
  });

  return { email: user.email };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Contact administrator.');
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'PASSWORD_CHANGE',
      status: 'FAILED',
      reason: 'Incorrect current password',
    });

    throw new Error('Current password is incorrect');
  }

  const isSamePassword = await user.comparePassword(newPassword);

  if (isSamePassword) {
    await writeAuditLog({
      userId: String(user._id),
      email: user.email,
      action: 'PASSWORD_CHANGE',
      status: 'FAILED',
      reason: 'New password matches current password',
    });

    throw new Error('New password must be different from current password');
  }

  user.password = newPassword;
  await user.save();

  await revokeAllUserSessions(String(user._id));

  await writeAuditLog({
    userId: String(user._id),
    email: user.email,
    action: 'PASSWORD_CHANGE',
    status: 'SUCCESS',
  });

  return { email: user.email };
};
