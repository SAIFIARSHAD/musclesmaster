import { Router } from 'express';

import {
  qrCheckInHandler,
  generateMemberQrHandler,
  manualCheckInHandler,
  qrCheckOutHandler,
  manualCheckOutHandler,
  branchAttendanceHandler,
  memberAttendanceHistoryHandler,
  createManualAttendanceHandler,
  updateAttendanceHandler,
  voidAttendanceHandler,
  attendanceAuditHistoryHandler,
  liveAttendanceHandler,
  dailyAttendanceHandler
} from '../controllers/attendance.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { UserRole } from '../constants/roles.enum';

import {
  manualCheckInValidator,
  qrCheckInValidator,
  qrCheckOutValidator,
  manualCheckOutValidator,
  branchAttendanceQueryValidator,
  memberAttendanceHistoryValidator,
  manualAttendanceValidator,
  updateAttendanceValidator,
  voidAttendanceValidator,
} from '../validators/attendance.validator';

const router = Router();

// All attendance routes require authentication.
router.use(authenticate);

// QR Check-in.
router.post(
  '/qr-check-in',
  allowRoles(UserRole.BRANCH_ADMIN, UserRole.RECEPTION),
  qrCheckInValidator,
  validateRequest,
  qrCheckInHandler,
);


// Reception Manual Check-in.
router.post(
  '/manual-check-in',
  allowRoles(UserRole.RECEPTION),
  manualCheckInValidator,
  validateRequest,
  manualCheckInHandler,
);

// QR Check-out.
router.post(
  '/qr-check-out',
  allowRoles(UserRole.BRANCH_ADMIN, UserRole.RECEPTION),
  qrCheckOutValidator,
  validateRequest,
  qrCheckOutHandler,
);

// Reception Manual Check-out.
router.post(
  '/manual-check-out',
  allowRoles(UserRole.RECEPTION),
  manualCheckOutValidator,
  validateRequest,
  manualCheckOutHandler,
);

// Branch-wise attendance list.
router.get(
  '/',
  allowRoles(UserRole.BRANCH_ADMIN, UserRole.RECEPTION),
  branchAttendanceQueryValidator,
  validateRequest,
  branchAttendanceHandler,
);

// Member-wise attendance history.
router.get(
  '/member/:memberId',
  allowRoles(UserRole.BRANCH_ADMIN, UserRole.RECEPTION),
  memberAttendanceHistoryValidator,
  validateRequest,
  memberAttendanceHistoryHandler,
);

// Generate or regenerate member QR.
router.post(
  '/members/:memberId/qr',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  generateMemberQrHandler,
);

// Branch Admin: Create historical manual attendance.
router.post(
  '/manual',
  allowRoles(UserRole.BRANCH_ADMIN),
  manualAttendanceValidator,
  validateRequest,
  createManualAttendanceHandler,
);


// Branch Admin: Correct an existing attendance session.
router.put(
  '/:attendanceId',
  allowRoles(UserRole.BRANCH_ADMIN),
  updateAttendanceValidator,
  validateRequest,
  updateAttendanceHandler,
);


// Branch Admin: Void an incorrect attendance session.
router.patch(
  '/:attendanceId/void',
  allowRoles(UserRole.BRANCH_ADMIN),
  voidAttendanceValidator,
  validateRequest,
  voidAttendanceHandler,
);
// Branch Admin: View attendance audit history.
router.get(
  '/:attendanceId/audit',
  allowRoles(UserRole.BRANCH_ADMIN),
  attendanceAuditHistoryHandler,
);

// Branch Admin: Members currently inside the gym.
router.get(
  '/live',
  allowRoles(UserRole.BRANCH_ADMIN),
  liveAttendanceHandler,
);
router.get(
  '/daily',
  allowRoles(UserRole.BRANCH_ADMIN),
  dailyAttendanceHandler,
);

export default router;
