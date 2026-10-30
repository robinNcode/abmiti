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
      charset:            'utf8mb4',
    });
    // Force utf8mb4 on every new connection so emoji are stored/read correctly,
    // even on cPanel-hosted MySQL where the server default charset is latin1.
    await pool.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
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
