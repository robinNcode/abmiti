import { Request, Response, NextFunction } from 'express';
import { receivableService } from './receivable.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export const receivableController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await receivableService.list(req.user!.userId, req.query.status as string | undefined);
      sendSuccess(res, result, 'OK', 200, { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages });
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.getOne(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.create(req.user!.userId, req.body);
      sendCreated(res, data, 'Receivable created');
    } catch (err) { next(err); }
  },

  async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.patch(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, data, 'Receivable updated');
    } catch (err) { next(err); }
  },

  async collect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.collect(req.user!.userId, req.params.id, req.body);
      sendCreated(res, data, 'Receivable collected');
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.cancel(req.user!.userId, req.params.id);
      sendSuccess(res, data, 'Receivable cancelled');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await receivableService.remove(req.user!.userId, req.params.id);
      sendSuccess(res, data, 'Receivable deleted');
    } catch (err) { next(err); }
  },
};
