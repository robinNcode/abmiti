"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCreated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta) => {
    const body = { success: true, data, message, ...(meta && { meta }) };
    return res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
const sendCreated = (res, data, message = 'Created') => (0, exports.sendSuccess)(res, data, message, 201);
exports.sendCreated = sendCreated;
//# sourceMappingURL=response.js.map