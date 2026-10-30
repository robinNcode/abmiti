"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMySQLPool = exports.connectMySQL = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../../../config/env");
const logger_1 = require("../../../config/logger");
let pool = null;
const connectMySQL = async () => {
    try {
        pool = promise_1.default.createPool({
            host: env_1.env.MYSQL_HOST,
            port: env_1.env.MYSQL_PORT,
            user: env_1.env.MYSQL_USER,
            password: env_1.env.MYSQL_PASSWORD,
            database: env_1.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            timezone: '+00:00',
        });
        // Verify connectivity
        const conn = await pool.getConnection();
        logger_1.logger.info(`MySQL connected: ${env_1.env.MYSQL_HOST}:${env_1.env.MYSQL_PORT}/${env_1.env.MYSQL_DATABASE}`);
        conn.release();
    }
    catch (err) {
        logger_1.logger.error('MySQL connection error:', err);
        throw err;
    }
};
exports.connectMySQL = connectMySQL;
const getMySQLPool = () => {
    if (!pool)
        throw new Error('MySQL pool not initialized. Call connectMySQL() first.');
    return pool;
};
exports.getMySQLPool = getMySQLPool;
//# sourceMappingURL=connection.js.map