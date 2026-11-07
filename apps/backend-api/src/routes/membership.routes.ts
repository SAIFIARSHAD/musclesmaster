import { Router } from 'express';
import {
  assignMembershipHandler,
  getMembershipsHandler,
  getMembershipByIdHandler,
  renewMembershipHandler,
  requestMembershipFreezeHandler,
  getMembershipFreezeRequestsHandler,
  reviewMembershipFreezeRequestHandler,
  unfreezeMembershipHandler,
} from '../controllers/membership.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

const router = Router();

router.use(authenticate);

// Get all freeze requests - staff only.
router.get(
  '/freeze-requests',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getMembershipFreezeRequestsHandler,
);

// Approve or reject a freeze request - staff only.
router.patch(
  '/freeze-requests/:requestId/review',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  reviewMembershipFreezeRequestHandler,
);

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

// Assign membership - staff only.
router.post(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  assignMembershipHandler,
);

// Renew membership - staff only.
router.post(
  '/:membershipId/renew',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  renewMembershipHandler,
);

// Submit membership freeze request - member only.
router.post(
  '/:membershipId/freeze-requests',
  allowRoles(UserRole.MEMBER),
  requestMembershipFreezeHandler,
);

// Manually unfreeze membership - staff only.
router.post(
  '/:membershipId/unfreeze',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  unfreezeMembershipHandler,
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

export default router;
