import crypto from 'crypto';
import mongoose from 'mongoose';

import { Session } from '../models/Session.model';
import { User } from '../models/User.model';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

const REFRESH_TOKEN_DAYS = 7;

export const hashRefreshToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getRefreshTokenExpiry = () =>
  new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

const getPayloadFromUser = (user: {
  _id: mongoose.Types.ObjectId;
  role: string;
  branchId?: string;
}) => ({
  userId: String(user._id),
  role: user.role,
  branchId: user.branchId,
});

export const createSession = async (
  user: {
    _id: mongoose.Types.ObjectId;
    role: string;
    branchId?: string;
  },
  meta: SessionMeta = {}
) => {
  const payload = getPayloadFromUser(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await Session.create({
    userId: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
    isRevoked: false,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return { accessToken, refreshToken };
};

/**
 * Resolve a refresh token to its active session owner.
 * Returns only identity details needed for auditing.
 */
export const getSessionOwnerByRefreshToken = async (
  refreshToken: string
) => {
  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return null;
  }

  if (!mongoose.isValidObjectId(payload.userId)) {
    return null;
  }

  const session = await Session.findOne({
    userId: payload.userId,
    refreshTokenHash: hashRefreshToken(refreshToken),
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('_id userId');

  if (!session) {
    return null;
  }

  const user = await User.findById(payload.userId)
    .select('_id email')
    .lean();

  if (!user) {
    return null;
  }

  return {
    userId: String(user._id),
    email: user.email,
  };
};

export const rotateRefreshToken = async (
  refreshToken: string,
  meta: SessionMeta = {}
) => {
  let payload: {
    userId: string;
    role: string;
    branchId?: string;
  };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), {
      statusCode: 401,
    });
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const session = await Session.findOne({
    refreshTokenHash: tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw Object.assign(new Error('Session is invalid or expired'), {
      statusCode: 401,
    });
  }

  const user = await User.findById(payload.userId);

  if (!user || !user.isActive) {
    session.isRevoked = true;
    await session.save();

    throw Object.assign(new Error('User account is unavailable'), {
      statusCode: 401,
    });
  }

  // Revoke the old refresh token before issuing a replacement.
  session.isRevoked = true;
  await session.save();

  const tokens = await createSession(user, meta);

  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    },
  };
};

export const revokeSessionByRefreshToken = async (
  refreshToken: string
) => {
  const tokenHash = hashRefreshToken(refreshToken);

  await Session.updateOne(
    {
      refreshTokenHash: tokenHash,
      isRevoked: false,
    },
    {
      $set: { isRevoked: true },
    }
  );
};


export const revokeAllUserSessions = async (
  userId: string,
  session?: mongoose.ClientSession,
) => {
  await Session.updateMany(
    {
      userId,
      isRevoked: false,
    },
    {
      $set: { isRevoked: true },
    },
    session ? { session } : {},
  );
};


/**
 * Fetch active sessions and identify the current device.
 * Refresh token hashes are never returned to the client.
 */
export const getActiveUserSessions = async (
  userId: string,
  currentRefreshToken?: string
) => {
  const currentTokenHash = currentRefreshToken
    ? hashRefreshToken(currentRefreshToken)
    : undefined;

  const sessions = await Session.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select('+refreshTokenHash')
    .sort({ createdAt: -1 })
    .lean();

  return sessions.map((session) => {
    const { refreshTokenHash, ...safeSession } = session;

    return {
      ...safeSession,
      isCurrent:
        !!currentTokenHash &&
        refreshTokenHash === currentTokenHash,
    };
  });
};

/**
 * Revoke one active session belonging to the specified user.
 */
export const revokeUserSessionById = async (
  sessionId: string,
  userId: string
) => {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw Object.assign(new Error('Invalid session ID'), {
      statusCode: 400,
    });
  }

  const session = await Session.findOne({
    _id: sessionId,
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw Object.assign(new Error('Active session not found'), {
      statusCode: 404,
    });
  }

  session.isRevoked = true;
  await session.save();
};
