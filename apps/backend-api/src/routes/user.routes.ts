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

router.use(authenticate);
router.use(allowRoles(UserRole.SUPER_ADMIN));

router.get('/', getUsersHandler);

router.post('/', validateCreateUser, createUserHandler);

router.put('/:id', validateUpdateUser, updateUserHandler);

router.patch('/:id/status', validateUserStatus, updateUserStatusHandler);

router.delete('/:id', deleteUserHandler);

export default router;