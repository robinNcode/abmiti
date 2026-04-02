import { Request, Response, NextFunction } from 'express';
import { entryService } from './entry.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { parsePagination } from '../../shared/utils/pagination';
import { IEntryFilters, EntryType, PaymentSource } from '../../shared/types';

export const entryController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: IEntryFilters = {
        type:     req.query.type     as EntryType,
        month:    req.query.month    ? parseInt(String(req.query.month), 10)  : undefined,
        year:     req.query.year     ? parseInt(String(req.query.year),  10)  : undefined,
        category: req.query.category as string,
        source:   req.query.source   as PaymentSource,
      };
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const result = await entryService.list(req.user!.userId, filters, pagination);
      sendSuccess(res, result.data, 'OK', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await entryService.getOne(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await entryService.create(req.user!.userId, req.body);
      sendCreated(res, data, 'Entry created');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await entryService.update(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, data, 'Entry updated');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await entryService.remove(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Entry deleted');
    } catch (err) { next(err); }
  },

  async parseSms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await entryService.parseSms(req.body.sms);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
