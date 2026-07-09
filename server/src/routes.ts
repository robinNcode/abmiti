import { Express } from 'express';
import authRouter from './modules/auth/auth.routes';
import entryRouter from './modules/entry/entry.routes';
import categoryRouter from './modules/category/category.routes';
import summaryRouter from './modules/summary/summary.routes';
import accountRouter from './modules/account/account.routes';
import budgetRouter from './modules/budget/budget.routes';

import { env } from './config/env';

const API_V1 = env.API_PREFIX;

export const registerRoutes = (app: Express): void => {
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'abmiti-api' }));
  app.use(`${API_V1}/auth`, authRouter);
  app.use(`${API_V1}/entries`, entryRouter);
  app.use(`${API_V1}/categories`, categoryRouter);
  app.use(`${API_V1}/summary`, summaryRouter);
  app.use(`${API_V1}/accounts`, accountRouter);
  app.use(`${API_V1}/budgets`, budgetRouter);
};
