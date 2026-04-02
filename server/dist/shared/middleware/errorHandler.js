"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const errors_1 = require("../utils/errors");
const globalErrorHandler = (err, _req, res, _next) => {
    logger_1.logger.error(err.message, { stack: err.stack });
    // Known operational errors
    if (err instanceof errors_1.ValidationError) {
        const body = { success: false, message: err.message, errors: err.errors };
        res.status(422).json(body);
        return;
    }
    if (err instanceof errors_1.AppError) {
        const body = { success: false, message: err.message };
        if (env_1.env.NODE_ENV === 'development')
            body.stack = err.stack;
        res.status(err.statusCode).json(body);
        return;
    }
    // Mongoose duplicate key
    if (err.name === 'MongoServerError' &&
        err.code === 11000) {
        res.status(409).json({ success: false, message: 'Duplicate entry — resource already exists' });
        return;
    }
    // Mongoose cast error
    if (err.name === 'CastError') {
        res.status(400).json({ success: false, message: 'Invalid ID format' });
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, message: 'Invalid token' });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, message: 'Token expired' });
        return;
    }
    // Unhandled errors
    const body = { success: false, message: 'Internal server error' };
    if (env_1.env.NODE_ENV === 'development')
        body.stack = err.stack;
    res.status(500).json(body);
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=errorHandler.js.map