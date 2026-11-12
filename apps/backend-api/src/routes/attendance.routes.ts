
import { Router } from 'express';

import {
  qrCheckInHandler,
  generateMemberQrHandler,
  manualCheckInHandler,
  qrCheckOutHandler,
  manualCheckOutHandler,
  branchAttendanceHandler,
  memberAttendanceHistoryHandler,
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

export default router;
