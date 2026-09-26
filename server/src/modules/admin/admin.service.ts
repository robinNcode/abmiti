import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { getMySQLPool } from '../../infrastructure/database/mysql/connection';
import { ContactMessage, BlogPost, SiteConfig, Notification, Payment, Subscription } from './admin.model';
import { BadRequestError } from '../../shared/utils/errors';

type RecordData = Record<string, any>;
const create = async (collection: any, table: string, data: RecordData) => {
  if (env.DB_PROVIDER === 'mongodb') return collection.create(data);
  const row = { id: randomUUID(), ...data };
  const names: Record<string, string> = { targetUserId: 'target_user_id', readBy: 'read_by', userId: 'user_id', transactionId: 'transaction_id', gatewayData: 'gateway_data', valId: 'gateway_data' };
  const keys = Object.keys(row).map((k) => names[k] ?? k);
  const values = Object.keys(row).map((k) => ['readBy', 'gatewayData'].includes(k) ? JSON.stringify(row[k]) : row[k]);
  await getMySQLPool().execute(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, values);
  return { ...row, created_at: new Date() };
};
const all = async (collection: any, table: string) => {
  if (env.DB_PROVIDER === 'mongodb') return collection.find().sort({ createdAt: -1 });
  const [rows] = await getMySQLPool().query(`SELECT * FROM ${table} ORDER BY created_at DESC`); return rows;
};
const configDefaults = { title: 'Abmiti', logo: '', subtitle: 'Your personal financial companion', content: {} as RecordData };
export const adminService = {
  publicConfig: async () => {
    if (env.DB_PROVIDER === 'mongodb') { const rows = await SiteConfig.find(); return Object.assign({}, configDefaults, ...rows.map((r: any) => ({ [r.key]: r.value }))); }
    const [rows] = await getMySQLPool().query<any[]>('SELECT config_key, config_value FROM site_config');
    return Object.assign({}, configDefaults, ...rows.map((r) => ({ [r.config_key]: typeof r.config_value === 'string' ? JSON.parse(r.config_value) : r.config_value })));
  },
  saveConfig: async (data: RecordData) => {
    const allowed = ['title', 'logo', 'subtitle', 'content'];
    for (const key of Object.keys(data)) if (!allowed.includes(key)) throw new BadRequestError(`Unsupported config field: ${key}`);
    for (const [key, value] of Object.entries(data)) {
      if (env.DB_PROVIDER === 'mongodb') await SiteConfig.findOneAndUpdate({ key }, { key, value }, { upsert: true });
      else await getMySQLPool().execute('INSERT INTO site_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)', [key, JSON.stringify(value)]);
    }
    return adminService.publicConfig();
  },
  contact: (data: RecordData) => create(ContactMessage, 'contact_messages', data),
  contacts: () => all(ContactMessage, 'contact_messages'),
  posts: () => all(BlogPost, 'blog_posts'),
  publicPosts: async () => env.DB_PROVIDER === 'mongodb'
    ? BlogPost.find({ published: true }).sort({ createdAt: -1 })
    : getMySQLPool().execute('SELECT * FROM blog_posts WHERE published=1 ORDER BY created_at DESC').then(([rows]) => rows),
  savePost: async (data: RecordData) => {
    data = { id: data.id, title: data.title, slug: data.slug, excerpt: data.excerpt ?? '', content: data.content, published: Boolean(data.published) };
    if (!data.title || !data.slug || !data.content) throw new BadRequestError('Title, slug and content are required');
    if (env.DB_PROVIDER === 'mongodb') return data.id ? BlogPost.findByIdAndUpdate(data.id, data, { new: true }) : BlogPost.create(data);
    if (data.id) { const { id, ...fields } = data; const pairs = Object.keys(fields).map((k) => `${k}=?`).join(','); await getMySQLPool().execute(`UPDATE blog_posts SET ${pairs}, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [...Object.values(fields), id]); return data; }
    return create(BlogPost, 'blog_posts', data);
  },
  notifications: (userId: string) => env.DB_PROVIDER === 'mongodb' ? Notification.find({ $or: [{ targetUserId: userId }, { targetUserId: null }] }).sort({ createdAt: -1 }) : getMySQLPool().execute('SELECT * FROM notifications WHERE target_user_id=? OR target_user_id IS NULL ORDER BY created_at DESC', [userId]).then(([r]) => r),
  sendNotification: (data: RecordData) => create(Notification, 'notifications', data),
  paymentByTransaction: (transactionId: string) => env.DB_PROVIDER === 'mongodb' ? Payment.findOne({ transactionId }) : getMySQLPool().execute<any[]>('SELECT * FROM payments WHERE transaction_id=? LIMIT 1', [transactionId]).then(([r]) => r[0] ?? null),
  savePayment: async (data: RecordData) => {
    if (env.DB_PROVIDER === 'mongodb') return Payment.findOneAndUpdate({ transactionId: data.transactionId }, { $set: data }, { upsert: true, new: true });
    const [result] = await getMySQLPool().execute<any>('UPDATE payments SET status=?, gateway_data=? WHERE transaction_id=?', [data.status, JSON.stringify({ valId: data.valId }), data.transactionId]);
    if (result.affectedRows) return data;
    return create(Payment, 'payments', data);
  },
  activateSubscription: async (userId: string, transactionId: string, plan: string) => {
    const startsAt = new Date(); const expiresAt = new Date(startsAt);
    if (plan === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const data = { userId, transactionId, plan, startsAt, expiresAt, status: 'active' };
    if (env.DB_PROVIDER === 'mongodb') return Subscription.findOneAndUpdate({ transactionId }, { $setOnInsert: data }, { upsert: true, new: true });
    await getMySQLPool().execute('INSERT IGNORE INTO subscriptions (id,user_id,transaction_id,plan,starts_at,expires_at,status) VALUES (?,?,?,?,?,?,?)', [randomUUID(), userId, transactionId, plan, startsAt, expiresAt, 'active']);
    return data;
  },
  subscriptions: async (userId: string) => env.DB_PROVIDER === 'mongodb'
    ? Subscription.find({ userId }).sort({ createdAt: -1 })
    : getMySQLPool().execute('SELECT * FROM subscriptions WHERE user_id=? ORDER BY created_at DESC', [userId]).then(([rows]) => rows),
};
