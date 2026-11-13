import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';
import {
  createRefundRequestHandler,
  reviewRefundRequestHandler,
  processRefundHandler,
} from '../controllers/refund.controller';

const router = Router();

router.use(authenticate);

// Employee/Reception can request refunds.
router.post(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  createRefundRequestHandler,
);

// Only Super Admin and Branch Admin can approve/reject.
router.patch(
  '/:refundId/review',
  allowRoles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  reviewRefundRequestHandler,
);

// Only Super Admin and Branch Admin can process approved refunds.
router.patch(
  '/:refundId/process',
  allowRoles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN),
  processRefundHandler,
);

export default router;
