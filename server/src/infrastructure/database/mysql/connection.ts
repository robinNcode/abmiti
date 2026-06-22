import mysql, { Pool } from 'mysql2/promise';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

let pool: Pool | null = null;

export const connectMySQL = async (): Promise<void> => {
  try {
    pool = mysql.createPool({
      host:               env.MYSQL_HOST,
      port:               env.MYSQL_PORT,
      user:               env.MYSQL_USER,
      password:           env.MYSQL_PASSWORD,
      database:           env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           '+00:00',
    });
    // Verify connectivity
    const conn = await pool.getConnection();
    logger.info(`MySQL connected: ${env.MYSQL_HOST}:${env.MYSQL_PORT}/${env.MYSQL_DATABASE}`);
    conn.release();
  } catch (err) {
    logger.error('MySQL connection error:', err);
    throw err;
  }
};

export const getMySQLPool = (): Pool => {
  if (!pool) throw new Error('MySQL pool not initialized. Call connectMySQL() first.');
  return pool;
};
