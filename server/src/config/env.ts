const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  MONGO_URI: required('MONGO_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
} as const;
