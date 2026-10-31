
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import {
  changePassword,
  forgotPassword,
  loginUser,
  resetPassword,
  verifyResetOtp,
} from '../services/auth.service';

import {
  getActiveUserSessions,
  getSessionOwnerByRefreshToken,
  revokeAllUserSessions,
  revokeSessionByRefreshToken,
  revokeUserSessionById,
  rotateRefreshToken,
} from '../services/session.service';

import { AuthRequest } from '../middlewares/auth.middleware';
import { AuditLog } from '../models/AuditLog.model';
import { User } from '../models/User.model';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const getClientMeta = (req: Request) => ({
  userAgent: req.get('user-agent') || undefined,
  ipAddress: req.ip || req.socket.remoteAddress || undefined,
});

const normalizeEmail = (email: unknown): string => {
  return typeof email === 'string' ? email.trim().toLowerCase() : 'unknown';
};

// Audit failures must not break authentication or session operations.
const writeAuditLog = async (
  req: Request,
  data: {
    userId?: string | mongoose.Types.ObjectId;
    email: string;
    action: string;
    status: 'SUCCESS' | 'FAILED';
    reason?: string;
  }
): Promise<void> => {
  try {
    const userId =
      data.userId && mongoose.Types.ObjectId.isValid(data.userId.toString())
        ? new mongoose.Types.ObjectId(data.userId.toString())
        : undefined;

    await AuditLog.create({
      ...(userId ? { userId } : {}),
      email: normalizeEmail(data.email),
      action: data.action,
      status: data.status,
      ipAddress: getClientMeta(req).ipAddress,
      userAgent: getClientMeta(req).userAgent,
      ...(data.reason ? { reason: data.reason.slice(0, 500) } : {}),
    });
  } catch (error) {
    console.error(`Failed to record audit event: ${data.action}`);
  }
};

const getUserEmail = async (userId: string): Promise<string> => {
  try {
    const user = await User.findById(userId).select('email').lean();
    return normalizeEmail(user?.email);
  } catch {
    return 'unknown';
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await loginUser(email, password, getClientMeta(req));

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    const result = await rotateRefreshToken(refreshToken, getClientMeta(req));

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Unable to refresh token',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const sessionOwner = refreshToken
  ? await getSessionOwnerByRefreshToken(refreshToken)
  : null;

    // Record the audit event even if there is no refresh cookie.
    // The current endpoint does not identify a user from the cookie here.
    if (refreshToken) {
      await revokeSessionByRefreshToken(refreshToken);
    }

    await writeAuditLog(req, {
      userId: sessionOwner?.userId,
      email: sessionOwner?.email || 'unknown',
      action: 'LOGOUT',
      status: 'SUCCESS',
      reason: 'Logout endpoint completed',
    });

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to complete logout',
    });
  }
};

export const logoutAllHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await revokeAllUserSessions(userId);

    await writeAuditLog(req, {
      userId,
      email: await getUserEmail(userId),
      action: 'LOGOUT_ALL',
      status: 'SUCCESS',
    });

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Unable to logout from all devices',
    });
  }
};

export const getSessionsHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const sessions = await getActiveUserSessions(
      userId,
      req.cookies?.refreshToken
    );

    return res.status(200).json({
      success: true,
      message: 'Active sessions fetched successfully',
      data: sessions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch sessions',
    });
  }
};

export const revokeSessionHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const sessionId = req.params.sessionId;

    if (typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    await revokeUserSessionById(sessionId, userId);

    await writeAuditLog(req, {
      userId,
      email: await getUserEmail(userId),
      action: 'SESSION_REVOKE',
      status: 'SUCCESS',
      reason: `Session ${sessionId} revoked`,
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to revoke session',
    });
  }
};

export const forgotPasswordHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (email === 'unknown') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    await forgotPassword(email);

    await writeAuditLog(req, {
      email,
      action: 'PASSWORD_RESET_REQUEST',
      status: 'SUCCESS',
    });

    return res.status(200).json({
      success: true,
      message: 'If the account exists, password reset instructions will be sent to its registered email.',
    });
  } catch (error: any) {
    await writeAuditLog(req, {
      email: normalizeEmail(req.body?.email),
      action: 'PASSWORD_RESET_REQUEST',
      status: 'FAILED',
      reason: 'Password reset request could not be completed',
    });

    return res.status(400).json({
      success: false,
      message: 'Unable to process password reset request',
    });
  }
};

export const verifyOtpHandler = async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);

  try {
    const { otp } = req.body;

    if (email === 'unknown' || typeof otp !== 'string' || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const result = await verifyResetOtp(email, otp);

    await writeAuditLog(req, {
      email,
      action: 'OTP_VERIFY',
      status: 'SUCCESS',
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verifiedToken: result.verifiedToken,
      },
    });
  } catch (error: any) {
    await writeAuditLog(req, {
      email,
      action: 'OTP_VERIFY',
      status: 'FAILED',
      reason: 'OTP verification failed',
    });

    return res.status(400).json({
      success: false,
      message: error.message || 'OTP verification failed',
    });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { verifiedToken, newPassword, confirmPassword } = req.body;

    if (
      typeof verifiedToken !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string' ||
      !verifiedToken ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Verified token, new password and confirm password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    await resetPassword(verifiedToken, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};

export const changePasswordHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string' ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Current password, new password and confirm password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await changePassword(userId, currentPassword, newPassword);

    await writeAuditLog(req, {
      userId,
      email: await getUserEmail(userId),
      action: 'PASSWORD_CHANGE',
      status: 'SUCCESS',
    });

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Unable to change password',
    });
  }
};
