
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

// All membership plan routes require Super Admin access.
router.use(authenticate);
router.use(allowRoles(UserRole.SUPER_ADMIN));

router.get('/', getMembershipPlansHandler);

router.get('/:id', getMembershipPlanByIdHandler);

router.post(
  '/',
  validateCreateMembershipPlan,
  createMembershipPlanHandler,
);

router.put(
  '/:id',
  validateUpdateMembershipPlan,
  updateMembershipPlanHandler,
);

// Soft delete: changes status to INACTIVE.
router.delete('/:id', deactivateMembershipPlanHandler);

export default router;
