import { Request, Response, NextFunction } from 'express';
import { budgetService } from './budget.service';
import { sendSuccess } from '../../shared/utils/response';

export const budgetController = {
  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await budgetService.upsert(req.user!.userId, req.body);
      sendSuccess(res, data, 'Budget saved successfully');
    } catch (err) { next(err); }
  },

  async getByMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = parseInt(req.query.month as string, 10);
      const year = parseInt(req.query.year as string, 10);
      if (!month || !year) {
        sendSuccess(res, null);
        return;
      }
      const data = await budgetService.getByMonth(req.user!.userId, month, year);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await budgetService.list(req.user!.userId);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetService.remove(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Budget deleted');
    } catch (err) { next(err); }
  },
};
