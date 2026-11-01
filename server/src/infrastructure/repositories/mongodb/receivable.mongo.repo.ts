import { Types } from 'mongoose';
import { Receivable } from '../../../modules/receivable/receivable.model';
import { IReceivableRepository } from '../../../shared/types/repositories';
import { IReceivable, IReceivableInput } from '../../../shared/types';

const toReceivable = (doc: any): IReceivable => ({
  _id:            doc._id.toString(),
  userId:         doc.user.toString(),
  counterparty:   doc.counterparty,
  principal:      doc.principal,
  receivedAmount: doc.receivedAmount,
  remaining:      doc.principal - doc.receivedAmount,
  kind:           doc.kind,
  categoryId:     doc.categoryId?.toString() ?? null,
  accountId:      doc.accountId?.toString() ?? null,
  dueDate:        doc.dueDate ?? null,
  note:           doc.note,
  status:         doc.status,
  createdAt:      doc.createdAt,
  updatedAt:      doc.updatedAt,
});

export class MongoReceivableRepository implements IReceivableRepository {
  async create(userId: string, data: IReceivableInput): Promise<IReceivable> {
    const doc = await Receivable.create({
      user:         new Types.ObjectId(userId),
      counterparty: data.counterparty,
      principal:    data.principal,
      kind:         data.kind,
      categoryId:   data.categoryId ? new Types.ObjectId(data.categoryId) : null,
      accountId:    data.accountId  ? new Types.ObjectId(data.accountId)  : null,
      dueDate:      data.dueDate    ? new Date(data.dueDate)              : null,
      note:         data.note,
    });
    return toReceivable(doc);
  }

  async findById(userId: string, id: string): Promise<IReceivable | null> {
    const doc = await Receivable.findOne({ _id: id, user: userId });
    return doc ? toReceivable(doc) : null;
  }

  async findMany(userId: string, status?: string): Promise<IReceivable[]> {
    const filter: any = { user: new Types.ObjectId(userId) };
    if (status) filter.status = status;
    const docs = await Receivable.find(filter).sort({ status: 1, dueDate: 1, createdAt: -1 });
    return docs.map(toReceivable);
  }

  async update(
    userId: string,
    id: string,
    data: Partial<Pick<IReceivableInput, 'counterparty' | 'note' | 'dueDate'>>,
  ): Promise<IReceivable | null> {
    const upd: any = {};
    if (data.counterparty !== undefined) upd.counterparty = data.counterparty;
    if (data.note         !== undefined) upd.note         = data.note ?? '';
    if (data.dueDate      !== undefined) upd.dueDate      = data.dueDate ? new Date(data.dueDate) : null;
    const doc = await Receivable.findOneAndUpdate({ _id: id, user: userId }, upd, { new: true });
    return doc ? toReceivable(doc) : null;
  }

  /** Atomic $inc — Mongo conditional update (no read-modify-write). */
  async applyCollection(
    userId: string,
    id: string,
    amount: number,
    newStatus: 'open' | 'settled',
  ): Promise<IReceivable | null> {
    const doc = await Receivable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId), status: 'open' },
      { $inc: { receivedAmount: amount }, $set: { status: newStatus } },
      { new: true },
    );
    return doc ? toReceivable(doc) : null;
  }

  /** Atomic $inc decrement + reopen. */
  async reverseCollection(userId: string, id: string, amount: number): Promise<IReceivable | null> {
    const doc = await Receivable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { $inc: { receivedAmount: -amount }, $set: { status: 'open' } },
      { new: true },
    );
    return doc ? toReceivable(doc) : null;
  }

  async cancel(userId: string, id: string): Promise<IReceivable | null> {
    const doc = await Receivable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId), receivedAmount: 0 },
      { status: 'cancelled' },
      { new: true },
    );
    return doc ? toReceivable(doc) : null;
  }
}
