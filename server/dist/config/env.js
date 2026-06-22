"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const required = (key) => {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required environment variable: ${key}`);
    return val;
};
const optional = (key, fallback = '') => process.env[key] ?? fallback;
const DB_PROVIDER = (process.env.DB_PROVIDER ?? 'mongodb');
exports.env = {
    NODE_ENV: (process.env.NODE_ENV ?? 'development'),
    PORT: parseInt(process.env.PORT ?? '5000', 10),
    DB_PROVIDER,
    // MongoDB — required only when DB_PROVIDER=mongodb
    MONGO_URI: DB_PROVIDER === 'mongodb' ? required('MONGO_URI') : optional('MONGO_URI'),
    // MySQL — required only when DB_PROVIDER=mysql
    MYSQL_HOST: DB_PROVIDER === 'mysql' ? required('MYSQL_HOST') : optional('MYSQL_HOST'),
    MYSQL_PORT: parseInt(optional('MYSQL_PORT', '3306'), 10),
    MYSQL_USER: DB_PROVIDER === 'mysql' ? required('MYSQL_USER') : optional('MYSQL_USER'),
    MYSQL_PASSWORD: DB_PROVIDER === 'mysql' ? required('MYSQL_PASSWORD') : optional('MYSQL_PASSWORD'),
    MYSQL_DATABASE: DB_PROVIDER === 'mysql' ? required('MYSQL_DATABASE') : optional('MYSQL_DATABASE'),
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
    JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
    CLIENT_URL: optional('CLIENT_URL', 'http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    RATE_LIMIT_MAX: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
};
//# sourceMappingURL=env.js.map