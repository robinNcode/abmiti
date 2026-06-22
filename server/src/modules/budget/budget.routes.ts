import { Router } from 'express';
import { budgetController } from './budget.controller';
import { validateUpsertBudget } from './budget.validators';
import { authenticate, validate } from '../../shared/middleware';

const router = Router();

router.use(authenticate);

router.post('/', validateUpsertBudget, validate, budgetController.upsert);
router.get('/monthly', budgetController.getByMonth);
router.get('/', budgetController.list);
router.delete('/:id', budgetController.remove);

export default router;
