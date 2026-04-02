"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("./category.controller");
const middleware_1 = require("../../shared/middleware");
const express_validator_1 = require("express-validator");
const middleware_2 = require("../../shared/middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
const createValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    (0, express_validator_1.body)('icon').optional().isString(),
    (0, express_validator_1.body)('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid hex color'),
];
router.get('/', category_controller_1.categoryController.list);
router.post('/', createValidator, middleware_2.validate, category_controller_1.categoryController.create);
router.patch('/:id', category_controller_1.categoryController.update);
router.delete('/:id', category_controller_1.categoryController.remove);
exports.default = router;
//# sourceMappingURL=category.routes.js.map