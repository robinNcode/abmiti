import { Request, Response, NextFunction } from 'express';
import { budgetService } from './budget.service';
import { sendSuccess } from '../../shared/utils/response';

const readMonthYear = (req: Request): { month: number; year: number } => ({
  month: Number(req.query.month),
  year: Number(req.query.year),
});

export const budgetController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.create(req.user!.userId, req.body), 'Budget created successfully', 201);
    } catch (err) { next(err); }
  },

  async getByMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = readMonthYear(req);
      sendSuccess(res, await budgetService.getByMonth(req.user!.userId, month, year));
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.list(req.user!.userId));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.update(req.user!.userId, req.params.id, req.body), 'Budget updated');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetService.remove(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Budget deleted');
    } catch (err) { next(err); }
  },

  async copy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toMonth, toYear } = { toMonth: Number(req.query.toMonth), toYear: Number(req.query.toYear) };
      sendSuccess(res, await budgetService.copy(req.user!.userId, req.params.id, toMonth, toYear), 'Budget copied');
    } catch (err) { next(err); }
  },

  async addLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.addLine(req.user!.userId, req.params.id, req.body), 'Budget line added', 201);
    } catch (err) { next(err); }
  },

  async updateLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.updateLine(req.user!.userId, req.params.id, req.params.lineId, req.body), 'Budget line updated');
    } catch (err) { next(err); }
  },

  async removeLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.removeLine(req.user!.userId, req.params.id, req.params.lineId), 'Budget line removed');
    } catch (err) { next(err); }
  },

  async reorderLines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.reorderLines(req.user!.userId, req.params.id, req.body.order), 'Budget lines reordered');
    } catch (err) { next(err); }
  },

  async templates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.templates(req.user!.userId));
    } catch (err) { next(err); }
  },

  async saveAsTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.saveAsTemplate(req.user!.userId, req.params.id, req.body.templateName), 'Template saved', 201);
    } catch (err) { next(err); }
  },

  async fromTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = readMonthYear(req);
      sendSuccess(res, await budgetService.fromTemplate(req.user!.userId, req.params.templateId, month, year), 'Template applied', 201);
    } catch (err) { next(err); }
  },

  async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetService.deleteTemplate(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Template deleted');
    } catch (err) { next(err); }
  },

  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.summary(req.user!.userId, req.params.id));
    } catch (err) { next(err); }
  },

  async lineEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await budgetService.lineEntries(req.user!.userId, req.params.id, req.params.lineId));
    } catch (err) { next(err); }
  },
};
