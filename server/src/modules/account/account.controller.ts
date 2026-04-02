import { Request, Response, NextFunction } from 'express';
import { accountService } from './account.service';
import { sendSuccess } from '../../shared/utils/response';
import { IAccountInput } from '../../shared/types';

export const accountController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: IAccountInput = req.body;
      const account = await accountService.create(req.user!.userId, input);
      sendSuccess(res, account, 'Account created successfully', 201);
    } catch (err) { next(err); }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await accountService.findByUser(req.user!.userId);
      sendSuccess(res, accounts);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountService.findById(req.user!.userId, req.params.id);
      if (!account) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      sendSuccess(res, account);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input: Partial<IAccountInput> = req.body;
      const account = await accountService.update(req.user!.userId, req.params.id, input);
      if (!account) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      sendSuccess(res, account, 'Account updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await accountService.delete(req.user!.userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      sendSuccess(res, null, 'Account deleted successfully');
    } catch (err) { next(err); }
  },
};
