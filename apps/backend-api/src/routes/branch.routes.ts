import { Router } from 'express';
import {
  createBranchHandler,
  getBranchByIdHandler,
  getBranchesHandler,
  updateBranchHandler,
  updateBranchStatusHandler,
  getAvailableBranchesForManagerHandler,
} from '../controllers/branch.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';
import {
  validateCreateBranch,
  validateUpdateBranch,
  validateBranchStatus,
} from '../validators/branch.validator';


const router = Router();

// All branch routes require authentication and Super Admin access.
router.use(authenticate);
router.use(allowRoles(UserRole.SUPER_ADMIN));

// Get all branches.
router.get('/', getBranchesHandler);

// Get active branches that are available for manager assignment.
// Keep this route before '/:id'.
router.get(
  '/available-for-manager',
  getAvailableBranchesForManagerHandler,
);

// Get a branch by ID.
router.get('/:id', getBranchByIdHandler);

// Create a branch.
router.post('/', validateCreateBranch, createBranchHandler);

// Update branch details.
router.put('/:id', validateUpdateBranch, updateBranchHandler);

// Activate or deactivate a branch.
router.patch(
  '/:id/status',
  validateBranchStatus,
  updateBranchStatusHandler,
);

export default router;
