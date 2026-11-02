import { body } from 'express-validator';
import { MAX_QUICK_EXPENSES } from './quick-expense.service';

export const validateQuickExpenses = [
  body('items').isArray({ max: MAX_QUICK_EXPENSES }).withMessage(`items must be an array of at most ${MAX_QUICK_EXPENSES} items`),
  body('items.*.label').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Each quick expense needs a name (max 100)'),
  body('items.*.icon').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('items.*.categoryId').optional({ nullable: true }).isString(),
  body('items.*.budgetLineId').optional({ nullable: true }).isString(),
  body('items.*.expectedAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  body('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
];
