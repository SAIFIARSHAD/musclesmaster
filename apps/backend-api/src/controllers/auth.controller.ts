import { Request, Response } from 'express';
import {loginUser, forgotPassword, verifyResetOtp, resetPassword, changePassword,} from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await loginUser(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};
export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your registered email',
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await verifyResetOtp(email, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: { verifiedToken: result.verifiedToken },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { verifiedToken, newPassword, confirmPassword } = req.body;

    if (!verifiedToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Verified token, new password and confirm password are required',
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

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password and confirm password are required',
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

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to change password',
    });
  }
};