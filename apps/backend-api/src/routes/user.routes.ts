import { Router } from 'express';

import {
  createUserHandler,
  deleteUserHandler,
  getUsersHandler,
  updateUserHandler,
  updateUserStatusHandler,
} from '../controllers/user.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

import {
  validateCreateUser,
  validateUpdateUser,
  validateUserStatus,
} from '../validators/user.validator';

import { UserRole } from '../constants/roles.enum';

const router = Router();

// Every user-management endpoint requires authentication.
router.use(authenticate);

// Only Super Admin and Branch Admin can access these routes.
// Branch-level and target-role restrictions are enforced in user.service.ts.
router.use(
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
  ),
);

// Fetch users within the logged-in admin's permitted scope.
router.get('/', getUsersHandler);

// Create a permitted user.
router.post('/', validateCreateUser, createUserHandler);

// Update a permitted user's details.
router.put('/:id', validateUpdateUser, updateUserHandler);

// Activate or deactivate a permitted user.
router.patch(
  '/:id/status',
  validateUserStatus,
  updateUserStatusHandler,
);

// Delete a permitted user.
router.delete('/:id', deleteUserHandler);

export default router;
