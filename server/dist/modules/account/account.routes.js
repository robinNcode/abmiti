"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_controller_1 = require("./account.controller");
const middleware_1 = require("../../shared/middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
router.use(middleware_1.requireUser);
router.post('/', account_controller_1.accountController.create);
router.get('/', account_controller_1.accountController.getAll);
router.get('/:id', account_controller_1.accountController.getById);
router.put('/:id', account_controller_1.accountController.update);
router.delete('/:id', account_controller_1.accountController.delete);
exports.default = router;
//# sourceMappingURL=account.routes.js.map