const rateLimit = require('express-rate-limit');

// In development mode, skip rate limiting so testing is never blocked.
// In production, enforce strict limits.
const isDev = process.env.NODE_ENV !== 'production';
const passthrough = (req, res, next) => next();

const createLimiter = (windowMs, max, message) => {
  if (isDev) return passthrough; // no rate limiting in dev
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API limiter
exports.apiLimiter = createLimiter(15 * 60 * 1000, 200, 'Too many requests, please try again later.');

// Auth limiter (stricter)
exports.authLimiter = createLimiter(15 * 60 * 1000, 50, 'Too many authentication attempts, please try again in 15 minutes.');

// AI limiter
exports.aiLimiter = createLimiter(60 * 1000, 20, 'Too many AI requests, please slow down.');
