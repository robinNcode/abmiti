import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';
import { env } from '../../config/env';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../utils/errors';
import { JwtPayload } from '../types';
import { container } from '../../container';

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
  let payload: JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    payload = decoded as JwtPayload;
    if (typeof payload.userId !== 'string' || !payload.userId) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  void container.userRepo.findById(payload.userId).then((user) => {
    if (!user) {
      next(new UnauthorizedError('User not found'));
      return;
    }
    req.user = {
      ...payload,
      userId: String(user._id),
      email: user.email,
      userType: user.userType ?? 'user',
    };
    next();
  }).catch(next);
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
  max: env.NODE_ENV === 'development' ? 5000 : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Not found handler ────────────────────────────────────────
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.userType !== 'admin') throw new ForbiddenError('Administrator access required');
  next();
};
