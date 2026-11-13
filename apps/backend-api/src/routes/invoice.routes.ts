import { Router } from 'express';

import { downloadInvoicePdfHandler } from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { UserRole } from '../constants/roles.enum';

const router = Router();

// All invoice routes require authentication.
router.use(authenticate);

// Download invoice PDF.
router.get(
  '/:invoiceId/pdf',
  allowRoles(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ),
  downloadInvoicePdfHandler,
);

export default router;
