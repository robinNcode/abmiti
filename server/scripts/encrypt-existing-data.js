const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const { env } = require('../dist/config/env');
const { transformUserData, userDataLookupHash } = require('../dist/shared/utils/userDataEncryption');

const encryptFields = (userId, row, fields) => {
  const transformed = transformUserData(userId, row, true);
  return fields.map((field) => transformed[field]);
};

const migrateMySQLTable = async (pool, table, fields, query) => {
  const [rows] = await pool.query(query);
  let migrated = 0;
  for (const row of rows) {
    const userId = String(row.user_id);
    if (table === 'users' && row.quick_expenses) {
      row.quick_expenses = typeof row.quick_expenses === 'string'
        ? JSON.parse(row.quick_expenses)
        : row.quick_expenses;
    }
    const encryptedValues = encryptFields(userId, row, fields);
    if (table === 'users' && row.quick_expenses) {
      encryptedValues[fields.indexOf('quick_expenses')] = JSON.stringify(
        transformUserData(userId, row.quick_expenses, true),
      );
    }
    await pool.execute(
      `UPDATE ${table} SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE id = ?`,
      [...encryptedValues, row.id],
    );
    migrated += 1;
  }
  console.info(`Encrypted ${migrated} ${table} row(s).`);
};

const migrateMySQL = async () => {
  const pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    charset: 'utf8mb4',
  });
  try {
    await migrateMySQLTable(pool, 'users', ['name', 'avatar', 'quick_expenses'],
      'SELECT id, id AS user_id, name, avatar, quick_expenses FROM users');
    await migrateMySQLTable(pool, 'categories', ['name'],
      'SELECT id, user_id, name FROM categories');
    const [categories] = await pool.query('SELECT id, user_id, name FROM categories');
    for (const category of categories) {
      await pool.execute(
        'UPDATE categories SET name_lookup_hash = ? WHERE id = ?',
        [userDataLookupHash(String(category.user_id), category.name), category.id],
      );
    }
    await pool.query('ALTER TABLE categories MODIFY COLUMN name_lookup_hash CHAR(64) NOT NULL');
    await migrateMySQLTable(pool, 'accounts', ['name', 'account_number', 'bank_name'],
      'SELECT id, user_id, name, account_number, bank_name FROM accounts');
    await migrateMySQLTable(pool, 'entries', ['note', 'sector', 'raw_sms'],
      'SELECT id, user_id, note, sector, raw_sms FROM entries');
    await migrateMySQLTable(pool, 'budgets', ['template_name', 'notes'],
      'SELECT id, user_id, template_name, notes FROM budgets');
    await migrateMySQLTable(pool, 'budget_lines', ['name', 'note'],
      `SELECT bl.id, b.user_id, bl.name, bl.note
       FROM budget_lines bl JOIN budgets b ON b.id = bl.budget_id`);
    await migrateMySQLTable(pool, 'budget_sub_items', ['name', 'note'],
      `SELECT si.id, b.user_id, si.name, si.note
       FROM budget_sub_items si
       JOIN budget_lines bl ON bl.id = si.budget_line_id
       JOIN budgets b ON b.id = bl.budget_id`);
    await migrateMySQLTable(pool, 'payables', ['counterparty', 'note'],
      'SELECT id, user_id, counterparty, note FROM payables');
    await migrateMySQLTable(pool, 'receivables', ['counterparty', 'note'],
      'SELECT id, user_id, counterparty, note FROM receivables');
  } finally {
    await pool.end();
  }
};

const migrateMongo = async () => {
  await mongoose.connect(env.MONGO_URI);
  const models = [
    ['users', mongoose.connection.collection('users'), '_id'],
    ['categories', mongoose.connection.collection('categories'), 'user'],
    ['accounts', mongoose.connection.collection('accounts'), 'user'],
    ['entries', mongoose.connection.collection('entries'), 'user'],
    ['budgets', mongoose.connection.collection('budgets'), 'user'],
    ['payables', mongoose.connection.collection('payables'), 'user'],
    ['receivables', mongoose.connection.collection('receivables'), 'user'],
  ];

  try {
    const categoryCollection = mongoose.connection.collection('categories');
    const indexes = await categoryCollection.listIndexes().toArray();
    for (const index of indexes) {
      if (index.unique && index.key.user && index.key.name && index.key.type) {
        await categoryCollection.dropIndex(index.name);
      }
    }

    for (const [name, collection, ownerField] of models) {
      let migrated = 0;
      for await (const document of collection.find({})) {
        const userId = String(document[ownerField]);
        const encrypted = transformUserData(userId, document, true);
        if (name === 'categories') {
          encrypted.nameLookupHash = userDataLookupHash(userId, document.name);
        }
        delete encrypted._id;
        if (Object.keys(encrypted).length) {
          await collection.updateOne({ _id: document._id }, { $set: encrypted });
          migrated += 1;
        }
      }
      console.info(`Encrypted ${migrated} ${name} document(s).`);
    }
    await categoryCollection.createIndex(
      { user: 1, nameLookupHash: 1, type: 1 },
      {
        unique: true,
        name: 'uq_user_category_hash',
        partialFilterExpression: { nameLookupHash: { $type: 'string' } },
      },
    );
  } finally {
    await mongoose.disconnect();
  }
};

const main = async () => {
  if (env.DB_PROVIDER === 'mysql') {
    await migrateMySQL();
  } else {
    await migrateMongo();
  }
};

main().catch((error) => {
  console.error('Could not encrypt existing user data.', error);
  process.exitCode = 1;
});
