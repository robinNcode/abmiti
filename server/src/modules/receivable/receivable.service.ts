import { container } from '../../container';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { IReceivable, IReceivableInput, IReceivableCollectInput, ReceivableStatus } from '../../shared/types';
import { env } from '../../config/env';
import { Types } from 'mongoose';

const SETTLEMENT_CATEGORY_NAME = 'Receivable Collection';

async function getOrCreateSettlementCategory(userId: string): Promise<string> {
  const existing = await container.categoryRepo.findByNameAndType(userId, SETTLEMENT_CATEGORY_NAME, 'income');
  if (existing) return existing._id.toString();
  const created = await container.categoryRepo.create({
    user:      userId,
    name:      SETTLEMENT_CATEGORY_NAME,
    icon:      '📥',
    color:     '#27ae60',
    type:      'income',
    isDefault: false,
  });
  return created._id.toString();
}

export const receivableService = {
  async list(userId: string, status?: string): Promise<{ data: IReceivable[]; total: number; page: number; limit: number; totalPages: number }> {
    const items = await container.receivableRepo.findMany(userId, status);
    return {
      data: items,
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  },

  async getOne(userId: string, id: string): Promise<IReceivable & { payments: unknown[] }> {
    const item = await container.receivableRepo.findById(userId, id);
    if (!item) throw new NotFoundError('Receivable');

    const isMongo = env.DB_PROVIDER === 'mongodb';
    let payments: unknown[] = [];
    if (isMongo) {
      const { Entry } = await import('../entry/entry.model');
      payments = await Entry.find({ user: new Types.ObjectId(userId), receivable: new Types.ObjectId(id) })
        .sort({ date: -1 })
        .lean() as any;
    } else {
      const pool = (await import('../../infrastructure/database/mysql/connection')).getMySQLPool();
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM entries WHERE user_id = ? AND receivable_id = ? ORDER BY date DESC',
        [userId, id],
      );
      payments = rows.map((r) => ({ ...r, _id: r.id }));
    }

    return { ...item, payments };
  },

  async create(userId: string, data: IReceivableInput): Promise<IReceivable> {
    if (!data.counterparty || data.counterparty.trim().length === 0) throw new BadRequestError('counterparty is required');
    if (data.principal <= 0) throw new BadRequestError('principal must be positive');
    if (data.kind !== 'lent_cash' && data.kind !== 'unpaid_income') throw new BadRequestError('kind must be lent_cash or unpaid_income');

    if (data.categoryId) {
      const cat = await container.categoryRepo.findById(data.categoryId);
      if (!cat) throw new NotFoundError('Category');
    }
    if (data.accountId) {
      const acc = await container.accountRepo.findById(userId, data.accountId);
      if (!acc) throw new NotFoundError('Account');
    }

    const created = await container.receivableRepo.create(userId, data);

    // lent_cash: user lent cash, debit the account balance
    if (data.kind === 'lent_cash' && data.accountId) {
      await container.accountRepo.updateBalance(userId, data.accountId, -data.principal);
    }

    return created;
  },

  async patch(
    userId: string,
    id: string,
    data: Partial<Pick<IReceivableInput, 'counterparty' | 'note' | 'dueDate'>> & Partial<Pick<IReceivableInput, 'principal'>>,
  ): Promise<IReceivable> {
    const existing = await container.receivableRepo.findById(userId, id);
    if (!existing) throw new NotFoundError('Receivable');
    if (existing.status === 'settled' || existing.status === 'cancelled') throw new BadRequestError('Cannot edit a non-open receivable');

    if (data.counterparty !== undefined && data.counterparty.trim().length === 0) {
      throw new BadRequestError('counterparty cannot be empty');
    }
    if (data.principal !== undefined && typeof data.principal !== 'number') throw new BadRequestError('principal must be a number');
    if (data.principal !== undefined && data.principal <= 0) throw new BadRequestError('principal must be positive');

    const updated = await container.receivableRepo.update(userId, id, data);
    if (!updated) throw new BadRequestError('Could not update receivable');
    return updated;
  },

  async collect(userId: string, id: string, data: IReceivableCollectInput): Promise<IReceivable & { entry?: unknown }> {
    const receivable = await container.receivableRepo.findById(userId, id);
    if (!receivable) throw new NotFoundError('Receivable');
    if (receivable.status !== 'open') throw new BadRequestError('Only open receivables can be collected');

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestError('amount must be positive');
    if (amount > receivable.remaining) throw new BadRequestError('amount cannot exceed remaining balance');

    const isMongo = env.DB_PROVIDER === 'mongodb';
    const categoryId = receivable.categoryId ?? await getOrCreateSettlementCategory(userId);
    const newReceived = Math.min(receivable.principal, receivable.receivedAmount + amount);
    const newRemaining = receivable.principal - newReceived;
    const newStatus: ReceivableStatus = newRemaining <= 0.001 ? 'settled' : 'open';
    const entryDate = data.date ? new Date(data.date) : new Date();

    const entryPayload: any = {
      user:       isMongo ? new Types.ObjectId(userId) : userId,
      type:       'income',
      amount,
      note:       data.note ?? `Receivable collection from ${receivable.counterparty}`,
      category:   isMongo ? new Types.ObjectId(categoryId) : categoryId,
      source:     (data.source ?? 'cash') as any,
      date:       entryDate,
      receivable: isMongo ? new Types.ObjectId(id) : id,
    };
    if (data.accountId) {
      entryPayload.account = isMongo ? new Types.ObjectId(data.accountId) : data.accountId;
    }

    const entry = await container.entryRepo.create(entryPayload);
    const updated = await container.receivableRepo.applyCollection(userId, id, amount, newStatus);
    if (!updated) throw new BadRequestError('Could not collect receivable');

    if (data.accountId) {
      const acc = await container.accountRepo.findById(userId, data.accountId);
      if (!acc) throw new NotFoundError('Account');
      await container.accountRepo.updateBalance(userId, data.accountId, amount);
    }

    return { ...updated, entry };
  },

  async cancel(userId: string, id: string): Promise<IReceivable> {
    const receivable = await container.receivableRepo.findById(userId, id);
    if (!receivable) throw new NotFoundError('Receivable');
    if (receivable.status !== 'open') throw new BadRequestError('Only open receivables can be cancelled');
    if (receivable.receivedAmount > 0) throw new BadRequestError('Cannot cancel a receivable that has been partially received');

    const updated = await container.receivableRepo.cancel(userId, id);
    if (!updated) throw new BadRequestError('Could not cancel receivable');
    return updated!;
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await container.receivableRepo.findById(userId, id);
    if (!deleted) throw new NotFoundError('Receivable');
    if (deleted.status !== 'cancelled') throw new BadRequestError('Only cancelled receivables can be deleted');

    await container.receivableRepo.cancel(userId, id);
  },
};
