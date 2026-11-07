import { Router } from 'express';

import {
  changePasswordHandler,
  forgotPasswordHandler,
  getSessionsHandler,
  login,
  logout,
  logoutAllHandler,
  refreshTokenHandler,
  resetPasswordHandler,
  revokeSessionHandler,
  verifyOtpHandler,
} from '../controllers/auth.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

import {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  otpVerificationRateLimiter,
} from '../middlewares/rateLimit.middleware';

const router = Router();

// Authentication
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);

// Password recovery
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  forgotPasswordHandler
);

router.post(
  '/verify-otp',
  otpVerificationRateLimiter,
  verifyOtpHandler
);

router.post('/reset-password', resetPasswordHandler);

// Authenticated password management
router.post('/change-password', authenticate, changePasswordHandler);

// Session management
router.post('/logout-all', authenticate, logoutAllHandler);
router.get('/sessions', authenticate, getSessionsHandler);

router.delete(
  '/sessions/:sessionId',
  authenticate,
  revokeSessionHandler
);

// Protected route for role-based access testing
router.get(
  '/test-protected',
  authenticate,
  allowRoles('SUPER_ADMIN'),
  (_req, res) => {
    return res.status(200).json({
      success: true,
      message: 'You accessed a protected SUPER_ADMIN route!',
    });
  }
);

export default router;
