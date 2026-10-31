import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';
import {
  getBranchSettingsHandler,
  updateBranchSettingsHandler,
} from '../controllers/branchSettings.controller';
import { validateBranchSettings } from '../validators/branchSettings.validator';

const router = Router();

router.use(authenticate);
router.use(allowRoles(UserRole.SUPER_ADMIN));

router.get('/:id/settings', getBranchSettingsHandler);
router.put('/:id/settings', validateBranchSettings, updateBranchSettingsHandler);

export default router;