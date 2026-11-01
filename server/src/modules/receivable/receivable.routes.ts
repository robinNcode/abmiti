import { Router } from 'express';
import { receivableController } from './receivable.controller';
import { validateCreateReceivable, validatePatchReceivable, validatePayment } from './receivable.validators';
import { authenticate, requireUser, validate } from '../../shared/middleware';

const router = Router();
router.use(authenticate);
router.use(requireUser);

// Receivable list + counts (no dedicated summary prefix)
router.get('/', receivableController.list);
router.post('/', validateCreateReceivable, validate, receivableController.create);
router.get('/:id', receivableController.getOne);
router.patch('/:id', validatePatchReceivable, validate, receivableController.patch);
router.post('/:id/collect', validatePayment, validate, receivableController.collect);
router.post('/:id/cancel', receivableController.cancel);
router.delete('/:id', receivableController.remove);

export default router;
