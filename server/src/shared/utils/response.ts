import { Response } from 'express';
import { ApiSuccess } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response => {
  const body: ApiSuccess<T> = { success: true, data, message, ...(meta && { meta }) };
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created'): Response =>
  sendSuccess(res, data, message, 201);
