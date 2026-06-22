"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_validators_1 = require("./auth.validators");
const middleware_1 = require("../../shared/middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_validators_1.registerValidator, middleware_1.validate, auth_controller_1.authController.register);
router.post('/login', auth_validators_1.loginValidator, middleware_1.validate, auth_controller_1.authController.login);
router.post('/refresh', auth_validators_1.refreshValidator, middleware_1.validate, auth_controller_1.authController.refresh);
router.get('/me', middleware_1.authenticate, auth_controller_1.authController.me);
router.patch('/me', middleware_1.authenticate, auth_validators_1.updateProfileValidator, middleware_1.validate, auth_controller_1.authController.updateMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map