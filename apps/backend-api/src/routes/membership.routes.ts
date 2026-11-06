
import { Router } from 'express';

import {
  assignMembershipHandler,
  getMembershipsHandler,
  getMembershipByIdHandler,
} from '../controllers/membership.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

const router = Router();

router.use(authenticate);

// Membership listing.
router.get(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
    UserRole.MEMBER,
  ),
  getMembershipsHandler,
);

// Single membership details and history.
router.get(
  '/:membershipId',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
    UserRole.MEMBER,
  ),
  getMembershipByIdHandler,
);

// Assign membership: staff only.
router.post(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  assignMembershipHandler,
);

export default router;
