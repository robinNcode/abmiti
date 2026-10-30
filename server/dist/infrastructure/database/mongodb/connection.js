"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../../../config/env");
const logger_1 = require("../../../config/logger");
const connectMongoDB = async () => {
    try {
        mongoose_1.default.set('strictQuery', true);
        const conn = await mongoose_1.default.connect(env_1.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        logger_1.logger.info(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (err) {
        logger_1.logger.error('MongoDB connection error:', err);
        throw err;
    }
};
exports.connectMongoDB = connectMongoDB;
//# sourceMappingURL=connection.js.map