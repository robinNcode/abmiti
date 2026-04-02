import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';
import { env } from '../../config/env';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { JwtPayload } from '../types';

// ── Extend Express Request ───────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ── Auth middleware ──────────────────────────────────────────
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

// ── Validation middleware ────────────────────────────────────
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  if (result.isEmpty()) { next(); return; }

  const errors: Record<string, string[]> = {};
  result.array().forEach((err) => {
    const field = (err as { path?: string }).path ?? 'general';
    if (!errors[field]) errors[field] = [];
    errors[field].push(err.msg);
  });
  throw new ValidationError(errors);
};

// ── Rate limiter ─────────────────────────────────────────────
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Not found handler ────────────────────────────────────────
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};
