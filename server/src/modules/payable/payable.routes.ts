import { Router } from 'express';
import { payableController } from './payable.controller';
import { validateCreatePayable, validatePayment, validatePatchPayable } from './payable.validators';
import { authenticate, requireUser, validate } from '../../shared/middleware';

const router = Router();
router.use(authenticate);
router.use(requireUser);

// Net position (under /summary prefix in routes.ts)
// Exposed here for convenience; registered under /payables in routes.ts
router.get('/net-position',               payableController.netPosition);

router.get('/',                           payableController.list);
router.post('/',    validateCreatePayable, validate, payableController.create);
router.get('/:id',                        payableController.get);
router.patch('/:id', validatePatchPayable, validate, payableController.patch);
router.post('/:id/payments', validatePayment, validate, payableController.pay);
router.delete('/:id/payments/:entryId',   payableController.deletePayment);
router.post('/:id/cancel',                payableController.cancel);

export default router;
