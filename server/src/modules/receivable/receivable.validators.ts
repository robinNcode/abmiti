import { body } from 'express-validator';

export const validateCreateReceivable = [
  body('counterparty').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Counterparty name required (max 100)'),
  body('principal').isFloat({ min: 0.01 }).withMessage('Principal must be positive'),
  body('kind').isIn(['lent_cash', 'unpaid_income']).withMessage('kind must be lent_cash or unpaid_income'),
  body('categoryId').optional().isString().notEmpty(),
  body('accountId').optional().isString().notEmpty(),
  body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO date'),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const validatePatchReceivable = [
  body('counterparty').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('note').optional().isString().isLength({ max: 300 }),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid ISO date'),
];

export const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  body('accountId').optional().isString().notEmpty(),
  body('source').optional().isIn(['bank', 'bkash', 'nagad', 'cash', 'card', 'other']),
  body('note').optional().isString().isLength({ max: 300 }),
];
