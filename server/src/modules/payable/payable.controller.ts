import { Request, Response, NextFunction } from 'express';
import { payableService } from './payable.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export const payableController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await payableService.create(req.user!.userId, req.body), 'Payable created');
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.list(req.user!.userId, req.query.status as string | undefined));
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.get(req.user!.userId, req.params.id));
    } catch (err) { next(err); }
  },

  async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.patch(req.user!.userId, req.params.id, req.body), 'Payable updated');
    } catch (err) { next(err); }
  },

  async pay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendCreated(res, await payableService.pay(req.user!.userId, req.params.id, req.body), 'Payment recorded');
    } catch (err) { next(err); }
  },

  async deletePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.deletePayment(req.user!.userId, req.params.id, req.params.entryId), 'Payment deleted');
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.cancel(req.user!.userId, req.params.id), 'Payable cancelled');
    } catch (err) { next(err); }
  },

  async netPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await payableService.netPosition(req.user!.userId));
    } catch (err) { next(err); }
  },
};
