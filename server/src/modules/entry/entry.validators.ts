import { body } from 'express-validator';

const isDatabaseId = (value: unknown): boolean =>
  typeof value === 'string' && (/^[0-9a-f]{24}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

export const createEntryValidator = [
  body('type').isIn(['income', 'expense', 'investment', 'savings', 'payable', 'receivable'])
    .withMessage('Type must be income, expense, investment, savings, payable or receivable'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('categoryId').custom(isDatabaseId).withMessage('Valid category ID required'),
  body('note').optional().isString().isLength({ max: 300 }),
  body('sector').optional().isString().isLength({ max: 120 }),
  body('source').optional().isIn(['bank','bkash','nagad','cash','card','other']),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

export const updateEntryValidator = [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('categoryId').optional().custom(isDatabaseId).withMessage('Valid category ID required'),
  body('note').optional().isString().isLength({ max: 300 }),
  body('source').optional().isIn(['bank','bkash','nagad','cash','card','other']),
  body('date').optional().isISO8601(),
];

export const parseSmsValidator = [
  body('sms').trim().notEmpty().withMessage('SMS text is required'),
];
