import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError, ValidationError } from '../utils/errors';
import { ApiError } from '../types';

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(err.message, { stack: err.stack });

  // Known operational errors
  if (err instanceof ValidationError) {
    const body: ApiError = { success: false, message: err.message, errors: err.errors };
    res.status(422).json(body);
    return;
  }

  if (err instanceof AppError) {
    const body: ApiError = { success: false, message: err.message };
    if (env.NODE_ENV === 'development') body.stack = err.stack;
    res.status(err.statusCode).json(body);
    return;
  }

  // Mongoose duplicate key
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' &&
    (err as unknown as { code: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate entry — resource already exists' });
    return;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Unhandled errors
  const body: ApiError = { success: false, message: 'Internal server error' };
  if (env.NODE_ENV === 'development') body.stack = err.stack;
  res.status(500).json(body);
};
