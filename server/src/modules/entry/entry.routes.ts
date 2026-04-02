import { Router } from 'express';
import { entryController } from './entry.controller';
import { createEntryValidator, updateEntryValidator, parseSmsValidator } from './entry.validators';
import { authenticate, validate } from '../../shared/middleware';

const router = Router();
router.use(authenticate);

router.get('/',          entryController.list);
router.post('/parse-sms', parseSmsValidator, validate, entryController.parseSms);
router.post('/',          createEntryValidator, validate, entryController.create);
router.get('/:id',        entryController.getOne);
router.patch('/:id',      updateEntryValidator, validate, entryController.update);
router.delete('/:id',     entryController.remove);

export default router;
