import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body);
      sendCreated(res, {
        user: { _id: user._id, name: user.name, email: user.email, budget: user.budget },
        ...tokens,
      }, 'Registration successful');
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.login(req.body);
      sendSuccess(res, {
        user: { _id: user._id, name: user.name, email: user.email, budget: user.budget },
        ...tokens,
      }, 'Login successful');
    } catch (err) { next(err); }
  },

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateMe(req.user!.userId, req.body);
      sendSuccess(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget }, 'Profile updated');
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget });
    } catch (err) { next(err); }
  },
};
