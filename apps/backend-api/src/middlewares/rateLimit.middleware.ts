
import { Request, Response, NextFunction } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

const createRateLimiter = ({
  windowMs,
  maxRequests,
  message,
}: RateLimitOptions) => {
  const requests = new Map<string, RateLimitEntry>();

  // Periodically remove expired entries to avoid unbounded memory growth.
  const cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of requests.entries()) {
      if (entry.resetAt <= now) {
        requests.delete(key);
      }
    }
  }, Math.min(windowMs, 60_000));

  // Do not keep the Node.js process alive solely for this timer.
  cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    // Express req.ip depends on the application's proxy configuration.
    const key = req.ip || req.socket.remoteAddress || 'unknown';

    let entry = requests.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };

      requests.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000)
    );

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader(
      'RateLimit-Reset',
      Math.ceil(entry.resetAt / 1000)
    );

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);

      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    return next();
  };
};

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message:
    'Too many password reset requests. Please try again after 15 minutes.',
});

export const otpVerificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message:
    'Too many OTP verification attempts. Please try again after 15 minutes.',
});
