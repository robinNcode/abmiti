import { Router } from 'express';
import { quickExpenseController } from './quick-expense.controller';
import { validateQuickExpenses } from './quick-expense.validators';
import { authenticate, requireUser, validate } from '../../shared/middleware';

const router = Router();
router.use(authenticate);
router.use(requireUser);

router.get('/', quickExpenseController.list);
router.put('/', validateQuickExpenses, validate, quickExpenseController.replace);

export default router;
