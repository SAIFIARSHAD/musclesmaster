import { Router } from 'express';
import { login, logout, forgotPasswordHandler, verifyOtpHandler, resetPasswordHandler } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/verify-otp', verifyOtpHandler);
router.post('/reset-password', resetPasswordHandler);

router.get('/test-protected', authenticate, allowRoles('SUPER_ADMIN'), (req, res) => {
  res.status(200).json({ success: true, message: 'You accessed a protected SUPER_ADMIN route!' });
});

export default router;