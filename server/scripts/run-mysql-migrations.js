const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const migrationsDir = path.join(rootDir, 'src', 'infrastructure', 'database', 'mysql', 'migrations');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

function upSection(sql) {
  const upMarker = '-- migrate:up';
  const downMarker = '-- migrate:down';
  const upIndex = sql.indexOf(upMarker);
  if (upIndex === -1) return sql;
  const downIndex = sql.indexOf(downMarker);
  return sql.slice(upIndex + upMarker.length, downIndex === -1 ? sql.length : downIndex);
}

function splitSql(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer = '';

  sql.split(/\r?\n/).forEach(function (line) {
    const trimmed = line.trim();
    if (/^DELIMITER\s+/i.test(trimmed)) {
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = '';
      }
      delimiter = trimmed.replace(/^DELIMITER\s+/i, '').trim();
      return;
    }

    buffer += line + '\n';
    if (buffer.trim().endsWith(delimiter)) {
      const statement = buffer.trim().slice(0, -delimiter.length).trim();
      if (statement) statements.push(statement);
      buffer = '';
    }
  });

  if (buffer.trim()) statements.push(buffer.trim());
  return statements.filter(function (statement) {
    return statement && !statement.trim().startsWith('--');
  });
}

async function main() {
  loadEnv(envPath);

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: false,
  });

  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(function (file) { return file.endsWith('.sql'); })
      .sort();

    for (const file of files) {
      await connection.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) NOT NULL PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)'
      );

      const version = file;
      const appliedRows = await connection.query('SELECT version FROM schema_migrations WHERE version = ? LIMIT 1', [version]);
      if (appliedRows[0].length) {
        console.log('skip ' + version);
        continue;
      }

      const sql = upSection(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      const statements = splitSql(sql);

      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          await connection.query(statement);
        }
        await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [version]);
        await connection.commit();
        console.log('applied ' + version);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error(error.message);
  process.exit(1);
});
