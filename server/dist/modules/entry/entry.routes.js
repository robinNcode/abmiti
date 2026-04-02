"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const entry_controller_1 = require("./entry.controller");
const entry_validators_1 = require("./entry.validators");
const middleware_1 = require("../../shared/middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
router.get('/', entry_controller_1.entryController.list);
router.post('/parse-sms', entry_validators_1.parseSmsValidator, middleware_1.validate, entry_controller_1.entryController.parseSms);
router.post('/', entry_validators_1.createEntryValidator, middleware_1.validate, entry_controller_1.entryController.create);
router.get('/:id', entry_controller_1.entryController.getOne);
router.patch('/:id', entry_validators_1.updateEntryValidator, middleware_1.validate, entry_controller_1.entryController.update);
router.delete('/:id', entry_controller_1.entryController.remove);
exports.default = router;
//# sourceMappingURL=entry.routes.js.map