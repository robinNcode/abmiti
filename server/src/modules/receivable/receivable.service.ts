import { container } from '../../container';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { IReceivable, IReceivableInput, IReceivableCollectInput, ReceivableKind, ReceivableStatus } from '../../shared/types';

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

  async getOne(userId: string, id: string): Promise<IReceivable> {
    const item = await container.receivableRepo.findById(userId, id);
    if (!item) throw new NotFoundError('Receivable');
    return item!;
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

    return container.receivableRepo.create(userId, data);
  },

  async patch(userId: string, id: string, data: Partial<Pick<IReceivableInput, 'counterparty' | 'note' | 'dueDate'>>): Promise<IReceivable> {
    const existing = await container.receivableRepo.findById(userId, id);
    if (!existing) throw new NotFoundError('Receivable');
    if (existing.status === 'settled' || existing.status === 'cancelled') throw new BadRequestError('Cannot edit a non-open receivable');

    if (data.counterparty !== undefined && data.counterparty.trim().length === 0) {
      throw new BadRequestError('counterparty cannot be empty');
    }
    if (data.principal !== undefined && typeof data.principal !== 'number') throw new BadRequestError('principal must be a number');
    if (data.principal !== undefined && data.principal <= 0) throw new BadRequestError('principal must be positive');

    return container.receivableRepo.update(userId, id, data);
  },

  async collect(userId: string, id: string, data: IReceivableCollectInput): Promise<IReceivable> {
    const receivable = await container.receivableRepo.findById(userId, id);
    if (!receivable) throw new NotFoundError('Receivable');
    if (receivable.status !== 'open') throw new BadRequestError('Only open receivables can be collected');

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestError('amount must be positive');
    if (amount > receivable.principal) throw new BadRequestError('amount cannot exceed principal');

    const newReceived = Math.min(receivable.principal, receivable.receivedAmount + amount);
    const newRemaining = receivable.principal - newReceived;
    const newStatus: ReceivableStatus = newRemaining <= 0.001 ? 'settled' : 'open';

    return container.receivableRepo.applyCollection(userId, id, amount, newStatus);
  },

  async cancel(userId: string, id: string): Promise<IReceivable> {
    const receivable = await container.receivableRepo.findById(userId, id);
    if (!receivable) throw new NotFoundError('Receivable');
    if (receivable.status !== 'open') throw new BadRequestError('Only open receivables can be cancelled');
    if (receivable.receivedAmount > 0) throw new BadRequestError('Cannot cancel a receivable that has been partially received');

    return receivable;
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await container.receivableRepo.findById(userId, id);
    if (!deleted) throw new NotFoundError('Receivable');
    if (deleted.status !== 'cancelled') throw new BadRequestError('Only cancelled receivables can be deleted');

    await container.receivableRepo.cancel(userId, id);
  },
};
