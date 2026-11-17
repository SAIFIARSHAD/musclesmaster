
import { Router } from 'express';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';
import { getReceptionBranchHandler } from '../controllers/reception.controller';

const router = Router();

router.use(authenticate);
router.use(allowRoles(UserRole.RECEPTION));

router.get('/branch', getReceptionBranchHandler);

export default router;
