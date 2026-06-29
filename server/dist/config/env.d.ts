type DbProvider = 'mongodb' | 'mysql';
type NodeEnv = 'development' | 'production' | 'test';
export declare const env: {
    readonly NODE_ENV: NodeEnv;
    readonly PORT: number;
    readonly API_PREFIX: string;
    readonly DB_PROVIDER: DbProvider;
    readonly MONGO_URI: string;
    readonly MYSQL_HOST: string;
    readonly MYSQL_PORT: number;
    readonly MYSQL_USER: string;
    readonly MYSQL_PASSWORD: string;
    readonly MYSQL_DATABASE: string;
    readonly JWT_SECRET: string;
    readonly JWT_EXPIRES_IN: string;
    readonly JWT_REFRESH_SECRET: string;
    readonly JWT_REFRESH_EXPIRES_IN: string;
    readonly CLIENT_URLS: string[];
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX: number;
};
export {};
//# sourceMappingURL=env.d.ts.map