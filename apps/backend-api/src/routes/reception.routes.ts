import { Router } from 'express';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

import {
  getReceptionBranchHandler,
  getReceptionTrainersHandler,
} from '../controllers/reception.controller';

const router = Router();

router.use(authenticate);
router.use(allowRoles(UserRole.RECEPTION));

router.get('/branch', getReceptionBranchHandler);
router.get('/trainers', getReceptionTrainersHandler);

export default router;
