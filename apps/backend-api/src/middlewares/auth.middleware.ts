
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';
import { Branch } from '../models/Branch.model';
import { UserRole } from '../constants/roles.enum';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    branchId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  let decoded: ReturnType<typeof verifyAccessToken>;

  try {
    decoded = verifyAccessToken(token);
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  try {
    const user = await User.findById(decoded.userId).select(
      '_id role branchId isActive',
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is unavailable',
      });
    }

    // Super Admin is not restricted by a branch's status.
    if (user.role !== UserRole.SUPER_ADMIN) {
      const branchId = user.branchId;

      if (!branchId) {
        return res.status(403).json({
          success: false,
          message: 'No branch is assigned to this account',
        });
      }

      const branch = await Branch.findById(branchId).select(
        '_id isActive',
      );

      if (!branch || !branch.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your branch is unavailable or inactive',
        });
      }
    }

    // Always use the latest role and branch from the database.
    req.user = {
      userId: String(user._id),
      role: user.role,
      branchId: user.branchId
        ? String(user.branchId)
        : undefined,
    };

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to authenticate user',
    });
  }
};
