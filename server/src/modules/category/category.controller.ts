import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { EntryType } from '../../shared/types';

export const categoryController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await categoryService.list(req.user!.userId, req.query.type as EntryType);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await categoryService.create(req.user!.userId, req.body);
      sendCreated(res, data, 'Category created');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await categoryService.update(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, data, 'Category updated');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.remove(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Category deleted');
    } catch (err) { next(err); }
  },
};
