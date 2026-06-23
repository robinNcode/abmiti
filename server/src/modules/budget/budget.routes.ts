import { Router } from 'express';
import { budgetController } from './budget.controller';
import {
  validateBudget,
  validateBudgetLine,
  validateCopyQuery,
  validateMonthYearQuery,
  validateReorderLines,
} from './budget.validators';
import { authenticate, validate } from '../../shared/middleware';

const router = Router();

router.use(authenticate);

router.get('/templates', budgetController.templates);
router.post('/from-template/:templateId', validateMonthYearQuery, validate, budgetController.fromTemplate);
router.delete('/templates/:id', budgetController.deleteTemplate);

router.get('/', validateMonthYearQuery, validate, budgetController.getByMonth);
router.post('/', validateBudget, validate, budgetController.create);
router.get('/list/all', budgetController.list);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);
router.post('/:id/copy', validateCopyQuery, validate, budgetController.copy);
router.post('/:id/save-as-template', budgetController.saveAsTemplate);

router.get('/:id/summary', budgetController.summary);
router.get('/:id/summary/line/:lineId', budgetController.lineEntries);
router.post('/:id/lines', validateBudgetLine, validate, budgetController.addLine);
router.put('/:id/lines/:lineId', validateBudgetLine, validate, budgetController.updateLine);
router.delete('/:id/lines/:lineId', budgetController.removeLine);
router.patch('/:id/lines/reorder', validateReorderLines, validate, budgetController.reorderLines);

export default router;
