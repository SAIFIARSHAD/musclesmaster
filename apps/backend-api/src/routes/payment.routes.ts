import { Router } from 'express';

import {
  createMembershipPaymentHandler,
  getPaymentHistoryHandler,
  getMembershipPaymentSummaryHandler,
  getPaymentAuditHistoryHandler,
} from '../controllers/payment.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

const router = Router();

// All payment routes require authentication.
router.use(authenticate);

// Collect membership payment - authorized staff only.
router.post(
  '/membership',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  createMembershipPaymentHandler,
);

// Payment history with filters and pagination
router.get(
  '/history',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getPaymentHistoryHandler,
);

// Membership payment and due summary
router.get(
  '/membership/:membershipId/summary',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getMembershipPaymentSummaryHandler,
);
// Payment audit history
router.get(
  '/:paymentId/audit-history',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getPaymentAuditHistoryHandler,
);

export default router;
