
import { Router } from 'express';

import {
  createMemberHandler,
  getMembersHandler,
  updateMemberHandler,
  updateMemberTrainerHandler,
  transferMemberBranchHandler,
} from '../controllers/member.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import {
  validateCreateMember,
  validateUpdateMember,
} from '../validators/member.validator';
import { UserRole } from '../constants/roles.enum';

const router = Router();

router.use(authenticate);

// Member listing: Super Admin, Branch Admin and Reception
router.get(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  getMembersHandler,
);

// Member registration: Super Admin, Branch Admin and Reception
router.post(
  '/',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  validateCreateMember,
  createMemberHandler,
);

router.put(
  '/:memberId',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
    UserRole.MEMBER,
  ),
  validateUpdateMember,
  updateMemberHandler,
);

// Transfer member from one branch to another: Super Admin only
router.patch(
  '/:memberId/transfer-branch',
  allowRoles(UserRole.SUPER_ADMIN),
  transferMemberBranchHandler,
);

// Assign or remove trainer
router.patch(
  '/:memberId/trainer',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  updateMemberTrainerHandler,
);

export default router;
