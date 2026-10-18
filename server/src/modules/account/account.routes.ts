import { Router } from 'express';
import { accountController } from './account.controller';
import { authenticate, requireUser } from '../../shared/middleware';

const router = Router();
router.use(authenticate);
router.use(requireUser);

router.post('/', accountController.create);
router.get('/', accountController.getAll);
router.get('/:id', accountController.getById);
router.put('/:id', accountController.update);
router.delete('/:id', accountController.delete);

export default router;
