import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { getMySQLPool } from '../../infrastructure/database/mysql/connection';
import { ContactMessage, BlogPost, SiteConfig, Notification, Payment, Subscription } from './admin.model';
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors';

type RecordData = Record<string, any>;
const dbNames: Record<string, string> = { targetUserId: 'target_user_id', readBy: 'read_by', clearedBy: 'cleared_by', userId: 'user_id', transactionId: 'transaction_id', gatewayData: 'gateway_data', valId: 'gateway_data', thumbnailUrl: 'thumbnail_url' };
const create = async (collection: any, table: string, data: RecordData) => {
  if (env.DB_PROVIDER === 'mongodb') return collection.create(data);
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const row: Record<string, any> = { id: randomUUID(), ...cleanData };
  const keys = Object.keys(row).map((k) => dbNames[k] ?? k);
  const values = Object.keys(row).map((k) => ['readBy', 'clearedBy', 'gatewayData'].includes(k) ? JSON.stringify(row[k]) : row[k]);
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
  contacts: async (page = 1, limit = 50) => {
    if (env.DB_PROVIDER === 'mongodb') {
      const data = await ContactMessage.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
      const total = await ContactMessage.countDocuments();
      return { data, total, page, limit };
    }
    const [rows] = await getMySQLPool().query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, (page - 1) * limit]);
    const [[{ c: total }]] = await getMySQLPool().query<any[]>(`SELECT COUNT(*) as c FROM contact_messages`);
    return { data: rows, total: Number(total), page, limit };
  },
  posts: () => all(BlogPost, 'blog_posts'),
  publicPosts: async () => env.DB_PROVIDER === 'mongodb'
    ? BlogPost.find({ published: true }).sort({ createdAt: -1 })
    : getMySQLPool().execute<any[]>('SELECT * FROM blog_posts WHERE published=1 ORDER BY created_at DESC').then(([rows]) => rows.map((r: any) => ({...r, thumbnailUrl: r.thumbnail_url}))),
  postBySlug: async (slug: string) => {
    if (!slug) throw new BadRequestError('Slug is required');
    let post: any = null;
    if (env.DB_PROVIDER === 'mongodb') {
      post = await BlogPost.findOne({ slug, published: true });
    } else {
      const [rows] = await getMySQLPool().execute<any[]>('SELECT * FROM blog_posts WHERE slug=? AND published=1 LIMIT 1', [slug]);
      post = rows[0] ? {...rows[0], thumbnailUrl: rows[0].thumbnail_url} : null;
    }
    if (!post) throw new BadRequestError('Post not found');
    return post;
  },
  savePost: async (data: RecordData) => {
    data = { title: data.title, slug: data.slug, excerpt: data.excerpt ?? '', content: data.content, published: Boolean(data.published), thumbnailUrl: data.thumbnailUrl ?? null, ...(data.id && { id: data.id }) };
    if (!data.title || !data.slug || !data.content) throw new BadRequestError('Title, slug and content are required');
    if (env.DB_PROVIDER === 'mongodb') return data.id ? BlogPost.findByIdAndUpdate(data.id, data, { new: true }) : BlogPost.create(data);
    if (data.id) { const { id, ...fields } = data; const pairs = Object.keys(fields).map((k) => `${dbNames[k] ?? k}=?`).join(','); await getMySQLPool().execute(`UPDATE blog_posts SET ${pairs}, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [...Object.values(fields), id]); return data; }
    return create(BlogPost, 'blog_posts', data);
  },
  deletePost: async (id: string) => {
    if (env.DB_PROVIDER === 'mongodb') return BlogPost.findByIdAndDelete(id);
    await getMySQLPool().execute('DELETE FROM blog_posts WHERE id=?', [id]);
    return { id };
  },
  deleteContact: async (id: string) => {
    if (env.DB_PROVIDER === 'mongodb') return ContactMessage.findByIdAndDelete(id);
    await getMySQLPool().execute('DELETE FROM contact_messages WHERE id=?', [id]);
    return { id };
  },
  resolveContact: async (id: string, is_resolved: boolean) => {
    if (env.DB_PROVIDER === 'mongodb') return ContactMessage.findByIdAndUpdate(id, { isResolved: is_resolved }, { new: true });
    await getMySQLPool().execute('UPDATE contact_messages SET is_resolved=? WHERE id=?', [is_resolved ? 1 : 0, id]);
    return { id, is_resolved };
  },
  isUserAdmin: async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const user = await User.findById(userId);
      return user?.userType === 'admin';
    }
    const [rows] = await getMySQLPool().execute<any[]>(
      'SELECT user_type FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    return rows.length > 0 && rows[0].user_type === 'admin';
  },
  filterNonAdminUserIds: async (userIds: string[]): Promise<string[]> => {
    if (!userIds || userIds.length === 0) return [];
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const nonAdmins = await User.find(
        { _id: { $in: userIds }, userType: 'user' },
        { _id: 1 }
      );
      return nonAdmins.map((u: any) => u._id.toString());
    }
    const pool = getMySQLPool();
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await pool.query<any[]>(
      `SELECT id FROM users WHERE id IN (${placeholders}) AND user_type = 'user'`,
      userIds
    );
    return rows.map((r) => r.id);
  },
  notifications: async (userId: string) => {
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const user = await User.findById(userId);
      // Strictly exclude admins from receiving user notifications
      if (!user || user.userType === 'admin') {
        return [];
      }
      const docs = await Notification.find({
        $and: [
          { $or: [{ targetUserId: userId }, { targetUserId: null }] },
          { clearedBy: { $ne: userId } },
        ],
      }).sort({ createdAt: -1 });
      return docs.map((d: any) => ({
        id: d._id?.toString() ?? d.id,
        _id: d._id?.toString(),
        title: d.title,
        message: d.message,
        targetUserId: d.targetUserId,
        readBy: Array.isArray(d.readBy) ? d.readBy : [],
        clearedBy: Array.isArray(d.clearedBy) ? d.clearedBy : [],
        createdAt: d.createdAt,
      }));
    }
    // MySQL: JOIN with users table and ensure user_type = 'user' at the query level
    const [rows] = await getMySQLPool().execute<any[]>(
      `SELECT n.* FROM notifications n
       JOIN users u ON u.id = ? AND u.user_type = 'user'
       WHERE (n.target_user_id = ? OR n.target_user_id IS NULL) 
         AND (n.cleared_by IS NULL OR NOT JSON_CONTAINS(n.cleared_by, JSON_QUOTE(?))) 
       ORDER BY n.created_at DESC`,
      [userId, userId, userId]
    );
    return rows.map((r) => ({
      ...r,
      targetUserId: r.target_user_id,
      readBy: typeof r.read_by === 'string' ? JSON.parse(r.read_by || '[]') : (r.read_by || []),
      clearedBy: typeof r.cleared_by === 'string' ? JSON.parse(r.cleared_by || '[]') : (r.cleared_by || []),
      createdAt: r.created_at,
    }));
  },
  allNotifications: async () => {
    // Collect admin IDs to sanitize readBy/clearedBy counts in admin view
    let adminIds = new Set<string>();
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const admins = await User.find({ userType: 'admin' }, { _id: 1 });
      adminIds = new Set(admins.map((a: any) => a._id.toString()));

      const docs = await Notification.find().sort({ createdAt: -1 });
      return docs.map((d: any) => {
        const rawReadBy = Array.isArray(d.readBy) ? d.readBy : [];
        const rawClearedBy = Array.isArray(d.clearedBy) ? d.clearedBy : [];
        return {
          id: d._id?.toString() ?? d.id,
          _id: d._id?.toString(),
          title: d.title,
          message: d.message,
          targetUserId: d.targetUserId,
          readBy: rawReadBy.filter((id: string) => !adminIds.has(id)),
          clearedBy: rawClearedBy.filter((id: string) => !adminIds.has(id)),
          createdAt: d.createdAt,
        };
      });
    }

    const [admins] = await getMySQLPool().query<any[]>("SELECT id FROM users WHERE user_type = 'admin'");
    adminIds = new Set(admins.map((a) => a.id));

    const [rows] = await getMySQLPool().query<any[]>('SELECT * FROM notifications ORDER BY created_at DESC');
    return rows.map((r) => {
      const rawReadBy = typeof r.read_by === 'string' ? JSON.parse(r.read_by || '[]') : (r.read_by || []);
      const rawClearedBy = typeof r.cleared_by === 'string' ? JSON.parse(r.cleared_by || '[]') : (r.cleared_by || []);
      return {
        ...r,
        targetUserId: r.target_user_id,
        readBy: (Array.isArray(rawReadBy) ? rawReadBy : []).filter((id: string) => !adminIds.has(id)),
        clearedBy: (Array.isArray(rawClearedBy) ? rawClearedBy : []).filter((id: string) => !adminIds.has(id)),
        createdAt: r.created_at,
      };
    });
  },
  sendNotification: async (data: RecordData) => {
    // Validate target user if specified - ensure target is NOT an admin
    if (data.targetUserId) {
      const isTargetAdmin = await adminService.isUserAdmin(data.targetUserId);
      if (isTargetAdmin) {
        throw new BadRequestError('Admin accounts cannot be targeted for user notifications');
      }
    }
    // If bulk targetUserIds are passed, filter out any admin IDs
    if (Array.isArray(data.targetUserIds)) {
      data.targetUserIds = await adminService.filterNonAdminUserIds(data.targetUserIds);
    }

    return create(Notification, 'notifications', {
      title: data.title,
      message: data.message,
      targetUserId: data.targetUserId || null,
      readBy: [],
      clearedBy: [],
    });
  },
  readNotification: async (id: string, userId: string) => {
    // Admin accounts cannot be recorded as recipients of user notifications
    const isAdmin = await adminService.isUserAdmin(userId);
    if (isAdmin) {
      throw new ForbiddenError('Admin accounts cannot interact with user notifications');
    }

    if (env.DB_PROVIDER === 'mongodb') {
      return Notification.findByIdAndUpdate(
        id,
        { $addToSet: { readBy: userId } },
        { new: true }
      );
    }
    const [rows] = await getMySQLPool().execute<any[]>('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) throw new BadRequestError('Notification not found');
    const current = rows[0];
    let readBy: string[] = typeof current.read_by === 'string' ? JSON.parse(current.read_by || '[]') : (current.read_by || []);
    if (!Array.isArray(readBy)) readBy = [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await getMySQLPool().execute('UPDATE notifications SET read_by = ? WHERE id = ?', [JSON.stringify(readBy), id]);
    }
    return {
      ...current,
      targetUserId: current.target_user_id,
      readBy,
      clearedBy: typeof current.cleared_by === 'string' ? JSON.parse(current.cleared_by || '[]') : (current.cleared_by || []),
      createdAt: current.created_at,
    };
  },
  readAllNotifications: async (userId: string) => {
    const isAdmin = await adminService.isUserAdmin(userId);
    if (isAdmin) {
      throw new ForbiddenError('Admin accounts cannot interact with user notifications');
    }

    if (env.DB_PROVIDER === 'mongodb') {
      await Notification.updateMany(
        { $or: [{ targetUserId: userId }, { targetUserId: null }] },
        { $addToSet: { readBy: userId } }
      );
      return { success: true };
    }
    const [rows] = await getMySQLPool().execute<any[]>(
      'SELECT id, read_by FROM notifications WHERE target_user_id = ? OR target_user_id IS NULL',
      [userId]
    );
    for (const row of rows) {
      let readBy: string[] = typeof row.read_by === 'string' ? JSON.parse(row.read_by || '[]') : (row.read_by || []);
      if (!Array.isArray(readBy)) readBy = [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await getMySQLPool().execute('UPDATE notifications SET read_by = ? WHERE id = ?', [JSON.stringify(readBy), row.id]);
      }
    }
    return { success: true };
  },
  clearNotification: async (id: string, userId: string) => {
    const isAdmin = await adminService.isUserAdmin(userId);
    if (isAdmin) {
      throw new ForbiddenError('Admin accounts cannot interact with user notifications');
    }

    if (env.DB_PROVIDER === 'mongodb') {
      return Notification.findByIdAndUpdate(
        id,
        { $addToSet: { clearedBy: userId } },
        { new: true }
      );
    }
    const [rows] = await getMySQLPool().execute<any[]>('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) throw new BadRequestError('Notification not found');
    const current = rows[0];
    let clearedBy: string[] = typeof current.cleared_by === 'string' ? JSON.parse(current.cleared_by || '[]') : (current.cleared_by || []);
    if (!Array.isArray(clearedBy)) clearedBy = [];
    if (!clearedBy.includes(userId)) {
      clearedBy.push(userId);
      await getMySQLPool().execute('UPDATE notifications SET cleared_by = ? WHERE id = ?', [JSON.stringify(clearedBy), id]);
    }
    return { id, cleared: true };
  },
  clearAllNotifications: async (userId: string) => {
    const isAdmin = await adminService.isUserAdmin(userId);
    if (isAdmin) {
      throw new ForbiddenError('Admin accounts cannot interact with user notifications');
    }

    if (env.DB_PROVIDER === 'mongodb') {
      await Notification.updateMany(
        { $or: [{ targetUserId: userId }, { targetUserId: null }] },
        { $addToSet: { clearedBy: userId } }
      );
      return { success: true };
    }
    const [rows] = await getMySQLPool().execute<any[]>(
      'SELECT id, cleared_by FROM notifications WHERE target_user_id = ? OR target_user_id IS NULL',
      [userId]
    );
    for (const row of rows) {
      let clearedBy: string[] = typeof row.cleared_by === 'string' ? JSON.parse(row.cleared_by || '[]') : (row.cleared_by || []);
      if (!Array.isArray(clearedBy)) clearedBy = [];
      if (!clearedBy.includes(userId)) {
        clearedBy.push(userId);
        await getMySQLPool().execute('UPDATE notifications SET cleared_by = ? WHERE id = ?', [JSON.stringify(clearedBy), row.id]);
      }
    }
    return { success: true };
  },
  deleteNotification: async (id: string) => {
    if (env.DB_PROVIDER === 'mongodb') return Notification.findByIdAndDelete(id);
    await getMySQLPool().execute('DELETE FROM notifications WHERE id=?', [id]);
    return { id };
  },

  // ── Admin: Date-wise Notification Report ───────────────────────
  notificationReport: async (startDate?: string, endDate?: string) => {
    let regularUsersCount = 0;
    let adminIds = new Set<string>();

    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      regularUsersCount = await User.countDocuments({ userType: 'user' });
      const admins = await User.find({ userType: 'admin' }, { _id: 1 });
      adminIds = new Set(admins.map((a: any) => a._id.toString()));
    } else {
      const pool = getMySQLPool();
      const [[u]] = await pool.query<any[]>("SELECT COUNT(*) as c FROM users WHERE user_type = 'user'");
      regularUsersCount = Number(u?.c ?? 0);
      const [admins] = await pool.query<any[]>("SELECT id FROM users WHERE user_type = 'admin'");
      adminIds = new Set(admins.map((a) => a.id));
    }

    let notificationsList: any[] = [];
    if (env.DB_PROVIDER === 'mongodb') {
      const filter: any = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      const docs = await Notification.find(filter).sort({ createdAt: -1 });
      notificationsList = docs.map((d: any) => ({
        id: d._id?.toString() ?? d.id,
        _id: d._id?.toString(),
        title: d.title,
        message: d.message,
        targetUserId: d.targetUserId,
        readBy: Array.isArray(d.readBy) ? d.readBy : [],
        clearedBy: Array.isArray(d.clearedBy) ? d.clearedBy : [],
        createdAt: d.createdAt,
      }));
    } else {
      const pool = getMySQLPool();
      let query = 'SELECT * FROM notifications';
      const params: any[] = [];
      const conditions: string[] = [];
      if (startDate) {
        conditions.push('created_at >= ?');
        params.push(new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push('created_at <= ?');
        params.push(end);
      }
      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.execute<any[]>(query, params);
      notificationsList = rows.map((r) => ({
        id: r.id,
        _id: r.id,
        title: r.title,
        message: r.message,
        targetUserId: r.target_user_id,
        readBy: typeof r.read_by === 'string' ? JSON.parse(r.read_by || '[]') : (r.read_by || []),
        clearedBy: typeof r.cleared_by === 'string' ? JSON.parse(r.cleared_by || '[]') : (r.cleared_by || []),
        createdAt: r.created_at,
      }));
    }

    // Process notifications, ensuring admin users are excluded from eligible recipients and read counts
    const processedNotifications = notificationsList.map((n) => {
      const validReadBy = (n.readBy || []).filter((id: string) => !adminIds.has(id));
      const validClearedBy = (n.clearedBy || []).filter((id: string) => !adminIds.has(id));

      const isBroadcast = !n.targetUserId;
      // Eligible recipients excludes all admins
      let eligibleRecipients = isBroadcast ? regularUsersCount : 0;
      if (!isBroadcast && n.targetUserId) {
        eligibleRecipients = adminIds.has(n.targetUserId) ? 0 : 1;
      }

      const readCount = validReadBy.length;
      const readRate = eligibleRecipients > 0 ? Number(((readCount / eligibleRecipients) * 100).toFixed(1)) : 0;
      const clearedCount = validClearedBy.length;
      const dateStr = n.createdAt ? new Date(n.createdAt).toISOString().slice(0, 10) : 'unknown';

      return {
        id: n.id,
        _id: n.id,
        title: n.title,
        message: n.message,
        targetUserId: n.targetUserId,
        targetType: isBroadcast ? 'all_users' : 'specific_user',
        eligibleRecipients,
        readCount,
        readRate,
        clearedCount,
        readBy: validReadBy,
        clearedBy: validClearedBy,
        date: dateStr,
        createdAt: n.createdAt,
      };
    });

    // Group date-wise
    const dateMap = new Map<string, {
      date: string;
      count: number;
      totalEligibleRecipients: number;
      totalReads: number;
      totalDismissed: number;
      notifications: any[];
    }>();

    for (const notif of processedNotifications) {
      const d = notif.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          count: 0,
          totalEligibleRecipients: 0,
          totalReads: 0,
          totalDismissed: 0,
          notifications: [],
        });
      }
      const entry = dateMap.get(d)!;
      entry.count += 1;
      entry.totalEligibleRecipients += notif.eligibleRecipients;
      entry.totalReads += notif.readCount;
      entry.totalDismissed += notif.clearedCount;
      entry.notifications.push(notif);
    }

    const dateWise = Array.from(dateMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => ({
        ...item,
        readRate: item.totalEligibleRecipients > 0
          ? Number(((item.totalReads / item.totalEligibleRecipients) * 100).toFixed(1))
          : 0,
      }));

    const totalSent = processedNotifications.length;
    const totalEligibleRecipients = processedNotifications.reduce((acc, n) => acc + n.eligibleRecipients, 0);
    const totalReads = processedNotifications.reduce((acc, n) => acc + n.readCount, 0);
    const overallReadRate = totalEligibleRecipients > 0
      ? Number(((totalReads / totalEligibleRecipients) * 100).toFixed(1))
      : 0;
    const totalDismissed = processedNotifications.reduce((acc, n) => acc + n.clearedCount, 0);

    return {
      summary: {
        totalSent,
        totalEligibleRecipients,
        totalReads,
        overallReadRate,
        totalDismissed,
        activeRegularUsers: regularUsersCount,
      },
      dateWise,
      notifications: processedNotifications,
    };
  },
  paymentByTransaction: (transactionId: string) => env.DB_PROVIDER === 'mongodb' ? Payment.findOne({ transactionId }) : getMySQLPool().execute<any[]>('SELECT * FROM payments WHERE transaction_id=? LIMIT 1', [transactionId]).then(([r]) => r[0] ?? null),
  savePayment: async (data: RecordData) => {
    if (env.DB_PROVIDER === 'mongodb') return Payment.findOneAndUpdate({ transactionId: data.transactionId }, { $set: data }, { upsert: true, new: true });
    const [result] = await getMySQLPool().execute<any>('UPDATE payments SET status=?, gateway_data=? WHERE transaction_id=?', [data.status, JSON.stringify({ valId: data.valId }), data.transactionId]);
    if (result.affectedRows) return data;
    return create(Payment, 'payments', data);
  },
  allPayments: () => all(Payment, 'payments'),
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
  allSubscriptions: () => all(Subscription, 'subscriptions'),

  // ── Admin: Users ──────────────────────────────────────────────
  users: async () => {
    const { container } = await import('../../container');
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      return User.find({}, { password: 0 }).sort({ createdAt: -1 });
    }
    const [rows] = await getMySQLPool().query('SELECT id, name, email, budget, avatar, user_type, created_at, updated_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  // ── Admin: Dashboard stats ────────────────────────────────────
  dashboardStats: async () => {
    let totalUsers = 0, totalPosts = 0, totalContacts = 0, totalPayments = 0, totalRevenue = 0, totalSubscriptions = 0, activeSubscriptions = 0;
    if (env.DB_PROVIDER === 'mongodb') {
      const mongoose = (await import('mongoose')).default;
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      totalUsers = await User.countDocuments();
      totalPosts = await BlogPost.countDocuments();
      totalContacts = await ContactMessage.countDocuments();
      totalPayments = await Payment.countDocuments();
      const revenueAgg = await Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
      totalRevenue = revenueAgg[0]?.total ?? 0;
      totalSubscriptions = await Subscription.countDocuments();
      activeSubscriptions = await Subscription.countDocuments({ status: 'active', expiresAt: { $gte: new Date() } });
    } else {
      const pool = getMySQLPool();
      const [[u]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM users');
      totalUsers = u?.c ?? 0;
      const [[p]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM blog_posts');
      totalPosts = p?.c ?? 0;
      const [[cm]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM contact_messages');
      totalContacts = cm?.c ?? 0;
      const [[pay]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM payments');
      totalPayments = pay?.c ?? 0;
      const [[rev]] = await pool.query<any[]>('SELECT COALESCE(SUM(amount),0) as c FROM payments WHERE status=?', ['paid']);
      totalRevenue = rev?.c ?? 0;
      const [[sub]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM subscriptions');
      totalSubscriptions = sub?.c ?? 0;
      const [[asub]] = await pool.query<any[]>('SELECT COUNT(*) as c FROM subscriptions WHERE status=? AND expires_at >= NOW()', ['active']);
      activeSubscriptions = asub?.c ?? 0;
    }
    return { totalUsers, totalPosts, totalContacts, totalPayments, totalRevenue, totalSubscriptions, activeSubscriptions };
  },
};
