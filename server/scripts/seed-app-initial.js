const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envFiles = [path.join(rootDir, '.env'), path.join(rootDir, '.env.production')];

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

for (const envFile of envFiles) loadEnv(envFile);

const dbProvider = (process.env.DB_PROVIDER || 'mysql').toLowerCase();
const mysqlUser = process.env.MYSQL_USER || 'abmiti_app';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'AbmitiApp!2025';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'abmiti_v2';
const mysqlAdminUser = process.env.MYSQL_ADMIN_USER || process.env.MYSQL_ROOT_USER || '';
const mysqlAdminPassword = process.env.MYSQL_ADMIN_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const appDefaults = {
  title: 'Abmiti',
  logo: '',
  subtitle: 'Your personal financial companion',
  content: {
    heroTitle: 'Money with clarity',
    heroSubtitle: 'Track income, budget wisely, and stay aligned with your values.',
    ctaPrimary: 'Start tracking',
    ctaSecondary: 'Learn more',
  },
};

async function ensureApplicationMysqlUser() {
  if (!mysqlAdminUser) return false;

  const mysql = require('mysql2/promise');
  const adminConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: mysqlAdminUser,
    password: mysqlAdminPassword,
  });

  try {
    const host = (process.env.MYSQL_HOST || 'localhost').toLowerCase() === 'localhost' ? 'localhost' : '%';
    await adminConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${mysqlDatabase}\``);
    await adminConnection.execute(
      `CREATE USER IF NOT EXISTS \`${mysqlUser}\`@'${host}' IDENTIFIED BY '${String(mysqlPassword).replace(/'/g, "\\'")}'`,
    );
    await adminConnection.execute(`GRANT ALL PRIVILEGES ON \`${mysqlDatabase}\`.* TO \`${mysqlUser}\`@'${host}'`);
    await adminConnection.execute('FLUSH PRIVILEGES');
    return true;
  } catch (error) {
    if (error && error.code === 'ER_CANNOT_USER') return true;
    throw error;
  } finally {
    await adminConnection.end();
  }
}

async function seedMongoApp() {
  const mongoose = require('mongoose');
  const { SiteConfig } = require('../src/modules/admin/admin.model');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/abmiti');

  for (const [key, value] of Object.entries(appDefaults)) {
    await SiteConfig.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
  }

  console.log('Mongo app defaults seeded.');
  await mongoose.disconnect();
}

async function seedMySQLApp() {
  const mysql = require('mysql2/promise');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: mysqlUser,
      password: mysqlPassword,
      database: mysqlDatabase,
    });
  } catch (error) {
    const canBootstrap = !!mysqlAdminUser;
    if (error && (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR') && canBootstrap) {
      try {
        await ensureApplicationMysqlUser();
        connection = await mysql.createConnection({
          host: process.env.MYSQL_HOST,
          port: Number(process.env.MYSQL_PORT || 3306),
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDatabase,
        });
      } catch (bootstrapError) {
        throw new Error(
          `MySQL app credentials are invalid for user "${mysqlUser}". Update server/.env with a valid MYSQL_USER/MYSQL_PASSWORD or set MYSQL_ADMIN_USER and MYSQL_ADMIN_PASSWORD to bootstrap the app database user.`,
          { cause: bootstrapError },
        );
      }
    } else {
      throw new Error(
        `MySQL app credentials are invalid for user "${mysqlUser}". Update server/.env with a valid MYSQL_USER/MYSQL_PASSWORD or set MYSQL_ADMIN_USER and MYSQL_ADMIN_PASSWORD to bootstrap the app database user.`,
        { cause: error },
      );
    }
  }

  try {
    for (const [key, value] of Object.entries(appDefaults)) {
      await connection.execute(
        'INSERT INTO site_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
        [key, JSON.stringify(value)],
      );
    }

    console.log('MySQL app defaults seeded.');
  } finally {
    await connection.end();
  }
}

async function main() {
  if (dbProvider === 'mongodb') {
    await seedMongoApp();
    return;
  }

  await seedMySQLApp();
}

main().catch((error) => {
  console.error('Application initial seeding failed:');
  console.error(error);
  process.exit(1);
});
