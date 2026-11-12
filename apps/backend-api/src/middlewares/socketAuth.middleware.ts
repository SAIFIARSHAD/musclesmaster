import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';
import { Branch } from '../models/Branch.model';
import { UserRole } from '../constants/roles.enum';

export interface AuthenticatedSocketData {
  userId: string;
  role: string;
  branchId?: string;
}

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (error?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || !token.trim()) {
      return next(new Error('Authentication token is required.'));
    }

    let decoded: ReturnType<typeof verifyAccessToken>;

    try {
      decoded = verifyAccessToken(token.trim());
    } catch {
      return next(new Error('Invalid or expired authentication token.'));
    }

    if (!decoded.userId) {
      return next(new Error('Invalid authentication payload.'));
    }

    const user = await User.findById(decoded.userId).select(
      '_id role branchId isActive',
    );

    if (!user || !user.isActive) {
      return next(new Error('User account is unavailable.'));
    }

    // Validate branch for all non-super-admin users.
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.branchId) {
        return next(new Error('No branch is assigned to this account.'));
      }

      const branch = await Branch.findById(user.branchId).select(
        '_id isActive',
      );

      if (!branch || !branch.isActive) {
        return next(new Error('Your branch is unavailable or inactive.'));
      }
    }

    // Store latest database identity in socket data.
    socket.data.user = {
      userId: String(user._id),
      role: user.role,
      branchId: user.branchId
        ? String(user.branchId)
        : undefined,
    } satisfies AuthenticatedSocketData;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Unable to authenticate socket connection.'));
  }
};
