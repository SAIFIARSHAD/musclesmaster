import { Request, Response } from 'express';
import { loginUser } from '../services/auth.service';

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