import winston from 'winston';
import { env } from './env';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${extra}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format:
    env.NODE_ENV === 'production'
      ? combine(timestamp(), json())
      : combine(timestamp({ format: 'HH:mm:ss' }), colorize(), devFormat),
  transports: [new winston.transports.Console()],
});
