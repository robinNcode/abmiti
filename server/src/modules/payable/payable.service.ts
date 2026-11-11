import { container } from '../../container';
import { AppError, NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { IPayable, IPayableInput, IPayablePaymentInput, INetPosition } from '../../shared/types';
import { env } from '../../config/env';
import { Types } from 'mongoose';
import { transformUserData } from '../../shared/utils/userDataEncryption';

/** Name of the lazily-created system category used for payable settlement expenses. */
const SETTLEMENT_CATEGORY_NAME = 'Payable Settlement';

async function getOrCreateSettlementCategory(userId: string): Promise<string> {
  const existing = await container.categoryRepo.findByNameAndType(userId, SETTLEMENT_CATEGORY_NAME, 'expense');
  if (existing) return existing._id.toString();
  const created = await container.categoryRepo.create({
    user:      userId,
    name:      SETTLEMENT_CATEGORY_NAME,
    icon:      '💳',
    color:     '#c0391c',
    type:      'expense',
    isDefault: false,
  });
  return created._id.toString();
}

export const payableService = {
  async create(userId: string, data: IPayableInput): Promise<IPayable> {
    // Validate category ownership if supplied
    if (data.categoryId) {
      const cat = await container.categoryRepo.findByUserAndId(userId, data.categoryId);
      if (!cat) throw new NotFoundError('Category');
    }
    // Validate account ownership if supplied
    if (data.accountId) {
      const acc = await container.accountRepo.findById(userId, data.accountId);
      if (!acc) throw new NotFoundError('Account');
    }

    const payable = await container.payableRepo.create(userId, data);

    // borrowed_cash → credit account balance (not an income entry)
    if (data.kind === 'borrowed_cash' && data.accountId) {
      await container.accountRepo.updateBalance(userId, data.accountId, data.principal);
    }
    // unpaid_expense → no balance change, no entry (cash-basis)

    return payable;
  },

  async list(userId: string, status?: string): Promise<IPayable[]> {
    return container.payableRepo.findMany(userId, status);
  },

  async get(userId: string, id: string): Promise<IPayable & { payments: unknown[] }> {
    const payable = await container.payableRepo.findById(userId, id);
    if (!payable) throw new NotFoundError('Payable');
    // Fetch linked expense entries (payments)
    const isMongo = env.DB_PROVIDER === 'mongodb';
    let payments: unknown[] = [];
    if (isMongo) {
      const { Entry } = await import('../entry/entry.model');
      const rows = await Entry.find({ user: new Types.ObjectId(userId), payable: new Types.ObjectId(id) })
        .sort({ date: -1 }).lean();
      payments = rows.map((row) => transformUserData(userId, row, false));
    } else {
      const { getMySQLPool } = await import('../../infrastructure/database/mysql/connection');
      const pool = getMySQLPool();
      const [rows] = await pool.query(
        'SELECT * FROM entries WHERE user_id = ? AND payable_id = ? ORDER BY date DESC',
        [userId, id],
      );
      payments = (rows as Record<string, unknown>[]).map((row) => transformUserData(userId, row, false));
    }
    return { ...payable, payments };
  },

  async patch(userId: string, id: string, data: { counterparty?: string; note?: string; dueDate?: string }): Promise<IPayable> {
    const payable = await container.payableRepo.findById(userId, id);
    if (!payable) throw new NotFoundError('Payable');
    if (payable.status === 'cancelled') throw new BadRequestError('Cannot edit a cancelled payable');
    const updated = await container.payableRepo.update(userId, id, data);
    return updated!;
  },

  async pay(userId: string, payableId: string, dto: IPayablePaymentInput): Promise<{ payable: IPayable; entry: unknown }> {
    const payable = await container.payableRepo.findById(userId, payableId);
    if (!payable) throw new NotFoundError('Payable');
    if (payable.status !== 'open') throw new BadRequestError('Payable is not open');
    if (dto.amount <= 0) throw new BadRequestError('Payment amount must be positive');
    if (dto.amount > payable.remaining) throw new BadRequestError('Payment exceeds remaining balance');

    const isMongo = env.DB_PROVIDER === 'mongodb';
    const categoryId = payable.categoryId ?? await getOrCreateSettlementCategory(userId);
    const newRemaining = payable.remaining - dto.amount;
    const newStatus: 'open' | 'settled' = newRemaining <= 0.001 ? 'settled' : 'open';
    const entryDate = dto.date ? new Date(dto.date) : new Date();

    // Build entry data
    const entryPayload: any = {
      user:     isMongo ? new Types.ObjectId(userId) : userId,
      type:     'expense',
      amount:   dto.amount,
      note:     dto.note ?? `Payable payment to ${payable.counterparty}`,
      category: isMongo ? new Types.ObjectId(categoryId) : categoryId,
      source:   (dto.source ?? 'cash') as any,
      date:     entryDate,
      payable:  isMongo ? new Types.ObjectId(payableId) : payableId,
    };
    if (dto.accountId) {
      entryPayload.account = isMongo ? new Types.ObjectId(dto.accountId) : dto.accountId;
    }

    // ONE transaction: create entry + update payable + optionally debit account
    const entry = await container.entryRepo.create(entryPayload);
    const updatedPayable = await container.payableRepo.applyPayment(userId, payableId, dto.amount, newStatus);

    if (!updatedPayable) throw new AppError('Payable update failed', 500);

    // Debit account if supplied
    if (dto.accountId) {
      const acc = await container.accountRepo.findById(userId, dto.accountId);
      if (!acc) throw new NotFoundError('Account');
      await container.accountRepo.updateBalance(userId, dto.accountId, -dto.amount);
    }

    return { payable: updatedPayable, entry };
  },

  async deletePayment(userId: string, payableId: string, entryId: string): Promise<IPayable> {
    // Find the entry — must belong to this payable
    const entry = await container.entryRepo.findById(entryId, userId);
    if (!entry) throw new NotFoundError('Payment entry');
    if (entry.payable?.toString() !== payableId) throw new BadRequestError('Entry does not belong to this payable');

    const payable = await container.payableRepo.findById(userId, payableId);
    if (!payable) throw new NotFoundError('Payable');

    // Reverse account balance if entry had an account
    if (entry.account) {
      await container.accountRepo.updateBalance(userId, entry.account.toString(), entry.amount);
    }

    // Delete entry + reverse payment atomically
    await container.entryRepo.remove(entryId, userId);
    const updated = await container.payableRepo.reversePayment(userId, payableId, entry.amount);
    return updated!;
  },

  async cancel(userId: string, id: string): Promise<IPayable> {
    const payable = await container.payableRepo.findById(userId, id);
    if (!payable) throw new NotFoundError('Payable');
    if (payable.paidAmount > 0) throw new BadRequestError('Cannot cancel a payable that has payments. Use settlement instead.');
    const updated = await container.payableRepo.cancel(userId, id);
    if (!updated) throw new BadRequestError('Payable could not be cancelled');
    return updated;
  },

  async netPosition(userId: string): Promise<INetPosition> {
    return container.payableRepo.getNetPosition(userId);
  },
};
