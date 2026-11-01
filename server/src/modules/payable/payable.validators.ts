import { body } from 'express-validator';

export const validateCreatePayable = [
  body('counterparty').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Counterparty name required (max 100)'),
  body('principal').isFloat({ min: 0.01 }).withMessage('Principal must be positive'),
  body('kind').isIn(['borrowed_cash', 'unpaid_expense']).withMessage('kind must be borrowed_cash or unpaid_expense'),
  body('categoryId').optional().isString().notEmpty(),
  body('accountId').optional().isString().notEmpty(),
  body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO date'),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be positive'),
  body('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  body('accountId').optional().isString().notEmpty(),
  body('source').optional().isIn(['bank', 'bkash', 'nagad', 'cash', 'card', 'other']),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const validatePatchPayable = [
  body('counterparty').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('note').optional().isString().isLength({ max: 300 }),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid ISO date'),
];
