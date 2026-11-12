import { Response } from 'express';

import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles.enum';
import {
  checkInByQr,
  checkInManually,
  checkOutByQr,
  checkOutManually,
  getBranchAttendance,
  getMemberAttendanceHistory,
  type AttendanceActor,
} from '../services/attendance.service';
import { AttendanceStatus } from '../models/AttendanceLog.model';
import { emitAttendanceUpdate } from '../utils/attendanceSocket';

import {
  generateMemberQr,
  type MemberQrActor,
} from '../services/memberQr.service';

const getErrorStatus = (
  error: unknown,
  fallback = 500,
): number => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  if (
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return fallback;
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
};

const getActor = (
  req: AuthRequest,
): AttendanceActor | null => {
  if (!req.user?.userId) {
    return null;
  }

  if (
    ![
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_ADMIN,
      UserRole.RECEPTION,
    ].includes(req.user.role as UserRole)
  ) {
    return null;
  }

  return {
    userId: req.user.userId,
    branchId: req.user.branchId,
  };
};

/**
 * POST /api/attendance/qr-check-in
 *
 * Scan member QR and mark attendance.
 */
export const qrCheckInHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance.',
      });
    }

    const { qrCode } = req.body;

    if (
      typeof qrCode !== 'string' ||
      !qrCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid QR code is required.',
      });
    }

    const result = await checkInByQr(qrCode, actor);

    try {
  emitAttendanceUpdate('attendance:check-in', result.attendance);
} catch (socketError) {
  console.error('QR check-in socket emission failed:', socketError);
}

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('QR attendance check-in error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to mark attendance.',
      ),
    });
  }
};



export const manualCheckInHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const memberId = req.body.memberId;

    if (typeof memberId !== 'string' || !memberId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required.',
      });
    }

    const actor: AttendanceActor = {
      userId: req.user.userId,
      branchId: req.user.branchId,
    };

    const result = await checkInManually(memberId, actor);

    try {
  emitAttendanceUpdate('attendance:check-in', result.attendance);
} catch (socketError) {
  console.error('Manual check-in socket emission failed:', socketError);
}

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Manual attendance check-in error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to mark manual attendance.',
      ),
    });
  }
};


/**
 * POST /api/attendance/members/:memberId/qr
 *
 * Generate or regenerate a member QR token.
 */
export const generateMemberQrHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const memberId = req.params.memberId;

    if (typeof memberId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID.',
      });
    }

    const actor: MemberQrActor = {
      userId: req.user.userId,
      role: req.user.role as UserRole,
      branchId: req.user.branchId,
    };

    const result = await generateMemberQr(memberId, actor);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Generate member QR error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to generate member QR.',
      ),
    });
  }
};


/**
 * POST /api/attendance/qr-check-out
 * QR-based member check-out
 */
export const qrCheckOutHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to process attendance.',
      });
    }

    const { qrCode } = req.body;

    if (typeof qrCode !== 'string' || !qrCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid QR code is required.',
      });
    }

    const result = await checkOutByQr(qrCode, actor);

    try {
  emitAttendanceUpdate('attendance:check-out', result.attendance);
} catch (socketError) {
  console.error('QR check-out socket emission failed:', socketError);
}

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('QR check-out error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to process QR check-out.',
      ),
    });
  }
};

/**
 * POST /api/attendance/manual-check-out
 * Reception manual check-out
 */
export const manualCheckOutHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to process attendance.',
      });
    }

    const { memberId } = req.body;

    if (typeof memberId !== 'string' || !memberId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required.',
      });
    }

    const result = await checkOutManually(memberId, actor);

    try {
  emitAttendanceUpdate('attendance:check-out', result.attendance);
} catch (socketError) {
  console.error('Manual check-out socket emission failed:', socketError);
}

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Manual check-out error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to process manual check-out.',
      ),
    });
  }
};

/**
 * GET /api/attendance
 * Branch-wise attendance list
 */
export const branchAttendanceHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view attendance.',
      });
    }

    const status =
      typeof req.query.status === 'string'
        ? req.query.status as AttendanceStatus
        : undefined;

    const result = await getBranchAttendance(actor, {
      date:
        typeof req.query.date === 'string'
          ? req.query.date
          : undefined,
      status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance list fetched successfully.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Attendance list error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch attendance list.',
      ),
    });
  }
};

/**
 * GET /api/attendance/member/:memberId
 * Member-wise attendance history
 */
export const memberAttendanceHistoryHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view attendance history.',
      });
    }

    const memberId = req.params.memberId;

    if (typeof memberId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID.',
      });
    }

    const result = await getMemberAttendanceHistory(
      memberId,
      actor,
      {
        startDate:
          typeof req.query.startDate === 'string'
            ? req.query.startDate
            : undefined,
        endDate:
          typeof req.query.endDate === 'string'
            ? req.query.endDate
            : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      },
    );

    return res.status(200).json({
      success: true,
      message: 'Member attendance history fetched successfully.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Member attendance history error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch member attendance history.',
      ),
    });
  }
};
