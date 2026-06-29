"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env only if it exists. CloudLinux/cPanel environment variables
// will override values from .env.
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), '.env'),
});
/**
 * Returns a required environment variable.
 *
 * @throws Error if the variable is missing or empty.
 */
function required(key) {
    const value = process.env[key]?.trim();
    if (key === 'MYSQL_PASSWORD') {
        return value ?? '';
    }
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
/**
 * Returns an optional environment variable.
 */
function optional(key, fallback = '') {
    const value = process.env[key]?.trim();
    return value === undefined || value === '' ? fallback : value;
}
/**
 * Determines the configured database provider.
 *
 * Defaults to MySQL instead of MongoDB since that's your current deployment.
 */
function getDbProvider() {
    const provider = optional('DB_PROVIDER', 'mysql').toLowerCase();
    if (provider !== 'mysql' && provider !== 'mongodb') {
        throw new Error(`Invalid DB_PROVIDER "${provider}". Expected "mysql" or "mongodb".`);
    }
    return provider;
}
const DB_PROVIDER = getDbProvider();
exports.env = {
    NODE_ENV: optional('NODE_ENV', 'development'),
    PORT: Number(optional('PORT', '5000')),
    API_PREFIX: optional('API_PREFIX', '/api/v1'),
    DB_PROVIDER,
    // MongoDB
    MONGO_URI: DB_PROVIDER === 'mongodb'
        ? required('MONGO_URI')
        : optional('MONGO_URI'),
    // MySQL
    MYSQL_HOST: DB_PROVIDER === 'mysql'
        ? required('MYSQL_HOST')
        : optional('MYSQL_HOST'),
    MYSQL_PORT: Number(optional('MYSQL_PORT', '3306')),
    MYSQL_USER: DB_PROVIDER === 'mysql'
        ? required('MYSQL_USER')
        : optional('MYSQL_USER'),
    MYSQL_PASSWORD: DB_PROVIDER === 'mysql'
        ? required('MYSQL_PASSWORD')
        : optional('MYSQL_PASSWORD'),
    MYSQL_DATABASE: DB_PROVIDER === 'mysql'
        ? required('MYSQL_DATABASE')
        : optional('MYSQL_DATABASE'),
    // JWT
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
    JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
    // CORS — comma-separated list of allowed origins (no trailing slashes, no paths)
    CLIENT_URLS: optional('CLIENT_URLS', 'http://localhost:5173,http://localhost:4173')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Number(optional('RATE_LIMIT_WINDOW_MS', '900000')),
    RATE_LIMIT_MAX: Number(optional('RATE_LIMIT_MAX', '100')),
};
//# sourceMappingURL=env.js.map