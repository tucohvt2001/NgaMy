import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Giới hạn số lần đăng nhập để chống brute-force
export const loginRateLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau',
    errors: [],
  },
});
