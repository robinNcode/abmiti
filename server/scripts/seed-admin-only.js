const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

const shouldReset = process.argv.includes('--reset') || process.env.RESET_DB === 'true';
const adminName = process.env.INITIAL_ADMIN_NAME || 'Abmiti Admin';
const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abmiti.local';
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
const dbProvider = (process.env.DB_PROVIDER || 'mysql').toLowerCase();
const mysqlUser = process.env.MYSQL_USER || 'abmiti_app';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'AbmitiApp!2025';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'abmiti_v2';
const mysqlAdminUser = process.env.MYSQL_ADMIN_USER || process.env.MYSQL_ROOT_USER || '';
const mysqlAdminPassword = process.env.MYSQL_ADMIN_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';

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

async function ensureMongoAdmin() {
  const mongoose = require('mongoose');
  const { User } = require('../src/modules/auth/auth.model');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/abmiti');

  if (shouldReset) {
    await User.deleteMany({ email: { $ne: adminEmail } });
  }

  let user = await User.findOne({ email: adminEmail });

  if (!user) {
    user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      userType: 'admin',
    });
  } else {
    user.name = adminName;
    user.userType = 'admin';
    user.password = adminPassword;
    await user.save();
  }

  console.log(`Mongo admin ready: ${user.email} (${user.userType})`);

  await mongoose.disconnect();
}

async function ensureMySQLAdmin() {
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
    if (shouldReset) {
      const tables = [
        'budget_line_categories',
        'budget_sub_items',
        'budget_lines',
        'budgets',
        'entries',
        'accounts',
        'categories',
        'notifications',
        'blog_posts',
        'contact_messages',
        'payments',
        'subscriptions',
        'site_config',
      ];

      for (const table of tables) {
        try {
          await connection.execute(`DELETE FROM \`${table}\``);
        } catch (error) {
          // ignore tables that do not exist yet; they will be created separately when the app starts
        }
      }

      await connection.execute('DELETE FROM users WHERE email <> ?', [adminEmail]);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await connection.execute(
      `INSERT INTO users (id, name, email, password, user_type)
       VALUES (UUID(), ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password = VALUES(password),
         user_type = VALUES(user_type)`,
      [adminName, adminEmail, passwordHash],
    );

    const [rows] = await connection.execute('SELECT email, user_type FROM users WHERE email = ? LIMIT 1', [adminEmail]);
    const user = rows[0];
    console.log(`MySQL admin ready: ${user.email} (${user.user_type})`);
  } finally {
    await connection.end();
  }
}

async function main() {
  if (dbProvider === 'mongodb') {
    await ensureMongoAdmin();
    return;
  }

  await ensureMySQLAdmin();
}

main().catch((error) => {
  console.error('Initial admin seeding failed:');
  console.error(error);
  process.exit(1);
});
