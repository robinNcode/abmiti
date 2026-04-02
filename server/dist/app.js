"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./shared/middleware/errorHandler");
const rateLimiter_1 = require("./shared/middleware/rateLimiter");
const notFoundHandler_1 = require("./shared/middleware/notFoundHandler");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
// ── Security middleware ──────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.CLIENT_URL, credentials: true }));
app.use((0, express_mongo_sanitize_1.default)());
// ── General middleware ───────────────────────────────────────
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// ── Rate limiting ────────────────────────────────────────────
app.use('/api', rateLimiter_1.rateLimiter);
// ── Routes ───────────────────────────────────────────────────
(0, routes_1.registerRoutes)(app);
// ── Error handling ───────────────────────────────────────────
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
// ── Bootstrap ───────────────────────────────────────────────
const start = async () => {
    await (0, database_1.connectDB)();
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`🚀 abmiti server running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
    });
};
start().catch((err) => {
    logger_1.logger.error('Failed to start server', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map