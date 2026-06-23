import { Router, Request, Response, NextFunction } from 'express';
import { summaryService } from './summary.service';
import { sendSuccess } from '../../shared/utils/response';
import { authenticate } from '../../shared/middleware';
import { container } from '../../container';

const router = Router();
router.use(authenticate);

const now = new Date();

router.get('/monthly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);
    const year  = parseInt(String(req.query.year  ?? now.getFullYear()),   10);
    const budgetDoc = await container.budgetRepo.findByMonth(req.user!.userId, month, year);
    const budget = budgetDoc?.totalIncome ?? 0;
    const data  = await summaryService.monthly(req.user!.userId, month, year, budget);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);
    const year  = parseInt(String(req.query.year  ?? now.getFullYear()),  10);
    const data  = await summaryService.categoryBreakdown(req.user!.userId, month, year);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/yearly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
    const data = await summaryService.yearlyTrend(req.user!.userId, year);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/yearly-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
    const data = await summaryService.yearly(req.user!.userId, year);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const data = await summaryService.accountSummaries(req.user!.userId, year);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/budget-warnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await summaryService.budgetWarnings(req.user!.userId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

export default router;
