import { Router } from 'express';

import {
  getMembershipPlansHandler,
  getMembershipPlanByIdHandler,
  createMembershipPlanHandler,
  updateMembershipPlanHandler,
  deactivateMembershipPlanHandler,
} from '../controllers/membershipPlan.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

import {
  validateCreateMembershipPlan,
  validateUpdateMembershipPlan,
} from '../validators/membershipPlan.validator';

const router = Router();

// All membership plan routes require authentication.
router.use(authenticate);

// Read-only access for Super Admin, Branch Admin and Reception.
router.get(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getMembershipPlansHandler,
);

router.get(
  '/:id',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getMembershipPlanByIdHandler,
);

// Only Super Admin can create membership plans.
router.post(
  '/',
  allowRoles(UserRole.SUPER_ADMIN),
  validateCreateMembershipPlan,
  createMembershipPlanHandler,
);

// Only Super Admin can update membership plans.
router.put(
  '/:id',
  allowRoles(UserRole.SUPER_ADMIN),
  validateUpdateMembershipPlan,
  updateMembershipPlanHandler,
);

// Only Super Admin can deactivate membership plans.
router.delete(
  '/:id',
  allowRoles(UserRole.SUPER_ADMIN),
  deactivateMembershipPlanHandler,
);

export default router;
