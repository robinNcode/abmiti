import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../shared/middleware';
import { body } from 'express-validator';
import { validate } from '../../shared/middleware';

const router = Router();
router.use(authenticate);

const createValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['income', 'expense', 'savings', 'investment', 'payable', 'receivable']).withMessage('Type must be income, expense, savings, investment, payable, or receivable'),
  body('icon').optional().isString(),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid hex color'),
];

router.get('/',        categoryController.list);
router.post('/',       createValidator, validate, categoryController.create);
router.patch('/:id',   categoryController.update);
router.delete('/:id',  categoryController.remove);

export default router;
