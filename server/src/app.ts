import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

import { env } from './config/env';
import { logger } from './config/logger';
import { globalErrorHandler } from './shared/middleware/errorHandler';
import { rateLimiter } from './shared/middleware/rateLimiter';
import { notFoundHandler } from './shared/middleware/notFoundHandler';
import { registerRoutes } from './routes';

// DB connections
import { connectMongoDB } from './infrastructure/database/mongodb/connection';
import { connectMySQL }   from './infrastructure/database/mysql/connection';

const app = express();

// ── Security middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
if (env.DB_PROVIDER === 'mongodb') {
  app.use(mongoSanitize());
}

// ── General middleware ───────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate limiting ────────────────────────────────────────────
app.use('/api', rateLimiter);

// ── Routes ───────────────────────────────────────────────────
registerRoutes(app);

// ── Error handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Bootstrap ───────────────────────────────────────────────
const start = async (): Promise<void> => {
  logger.info(`🗄️  DB provider: ${env.DB_PROVIDER}`);

  if (env.DB_PROVIDER === 'mysql') {
    await connectMySQL();
  } else {
    await connectMongoDB();
  }

  app.listen(env.PORT, () => {
    logger.info(`🚀 abmiti server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});

export default app;
