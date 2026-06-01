import { Router } from 'express';
import { authController } from './auth.controller';
import { registerValidator, loginValidator, refreshValidator, updateProfileValidator } from './auth.validators';
import { authenticate, validate } from '../../shared/middleware';

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login',    loginValidator,    validate, authController.login);
router.post('/refresh',  refreshValidator,  validate, authController.refresh);
router.get('/me',        authenticate,               authController.me);
router.patch('/me',      authenticate, updateProfileValidator, validate, authController.updateMe);

export default router;
