import { body } from 'express-validator';

export const validateUpsertBudget = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Year must be valid'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Budget must be greater than zero'),
];
