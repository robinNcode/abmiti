import { Request, Response, NextFunction } from 'express';
import { quickExpenseService } from './quick-expense.service';
import { sendSuccess } from '../../shared/utils/response';

const now = new Date();

const period = (raw: { month?: unknown; year?: unknown }) => ({
  month: Number(raw.month) >= 1 && Number(raw.month) <= 12 ? Number(raw.month) : now.getMonth() + 1,
  year:  Number(raw.year) >= 2000 ? Number(raw.year) : now.getFullYear(),
});

export const quickExpenseController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = period(req.query as Record<string, unknown>);
      const data = await quickExpenseService.list(req.user!.userId, month, year);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async replace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = period(req.body as Record<string, unknown>);
      const data = await quickExpenseService.replace(req.user!.userId, req.body.items, month, year);
      sendSuccess(res, data, 'Quick expenses saved');
    } catch (err) { next(err); }
  },
};
