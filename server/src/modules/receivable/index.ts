import { Router } from 'express';
import receivableRouter from './receivable.routes';

const router = Router();

router.use('/api/receivables', receivableRouter);

// SPA fallback for /abmiti/*
router.get('/abmiti/*', (_req, res) => {
  res.sendFile(require('path').join(__dirname, '../../../public', 'index.html'));
});

export default router;
