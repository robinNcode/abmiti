import { Types } from 'mongoose';
import { Payable } from '../../../modules/payable/payable.model';
import { IPayableRepository } from '../../../shared/types/repositories';
import { IPayable, IPayableInput, INetPosition } from '../../../shared/types';
import { Account } from '../../../modules/account/account.model';
import { Entry } from '../../../modules/entry/entry.model';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

const toPayable = (source: any): IPayable => {
  const doc = transformUserData(String(source.user), source.toObject(), false);
  return ({
  _id:          doc._id.toString(),
  userId:       doc.user.toString(),
  counterparty: doc.counterparty,
  principal:    doc.principal,
  paidAmount:   doc.paidAmount,
  remaining:    doc.principal - doc.paidAmount,
  kind:         doc.kind,
  categoryId:   doc.categoryId?.toString() ?? null,
  accountId:    doc.accountId?.toString() ?? null,
  dueDate:      doc.dueDate ?? null,
  note:         doc.note,
  status:       doc.status,
  createdAt:    doc.createdAt,
  updatedAt:    doc.updatedAt,
  });
};

export class MongoPayableRepository implements IPayableRepository {
  async create(userId: string, data: IPayableInput): Promise<IPayable> {
    const doc = await Payable.create({
      ...transformUserData(userId, data, true),
      user:         new Types.ObjectId(userId),
      principal:    data.principal,
      kind:         data.kind,
      categoryId:   data.categoryId ? new Types.ObjectId(data.categoryId) : null,
      accountId:    data.accountId  ? new Types.ObjectId(data.accountId)  : null,
      dueDate:      data.dueDate    ? new Date(data.dueDate)              : null,
    });
    return toPayable(doc);
  }

  async findById(userId: string, id: string): Promise<IPayable | null> {
    const doc = await Payable.findOne({ _id: id, user: userId });
    return doc ? toPayable(doc) : null;
  }

  async findMany(userId: string, status?: string): Promise<IPayable[]> {
    const filter: any = { user: new Types.ObjectId(userId) };
    if (status) filter.status = status;
    const docs = await Payable.find(filter).sort({ status: 1, dueDate: 1, createdAt: -1 });
    return docs.map(toPayable);
  }

  async update(userId: string, id: string, data: Partial<Pick<IPayableInput, 'counterparty' | 'note' | 'dueDate'>>): Promise<IPayable | null> {
    const upd: any = {};
    const encrypted = transformUserData(userId, data, true);
    if (data.counterparty !== undefined) upd.counterparty = encrypted.counterparty;
    if (data.note         !== undefined) upd.note         = encrypted.note ?? '';
    if (data.dueDate      !== undefined) upd.dueDate      = data.dueDate ? new Date(data.dueDate) : null;
    const doc = await Payable.findOneAndUpdate({ _id: id, user: userId }, upd, { new: true });
    return doc ? toPayable(doc) : null;
  }

  /** Atomic $inc — Mongo conditional update (no read-modify-write). */
  async applyPayment(userId: string, id: string, amount: number, newStatus: 'open' | 'settled'): Promise<IPayable | null> {
    const doc = await Payable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId), status: 'open' },
      { $inc: { paidAmount: amount }, $set: { status: newStatus } },
      { new: true },
    );
    return doc ? toPayable(doc) : null;
  }

  /** Atomic $inc decrement + reopen. */
  async reversePayment(userId: string, id: string, amount: number): Promise<IPayable | null> {
    const doc = await Payable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { $inc: { paidAmount: -amount }, $set: { status: 'open' } },
      { new: true },
    );
    return doc ? toPayable(doc) : null;
  }

  async cancel(userId: string, id: string): Promise<IPayable | null> {
    const doc = await Payable.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId), paidAmount: 0 },
      { status: 'cancelled' },
      { new: true },
    );
    return doc ? toPayable(doc) : null;
  }

  async getNetPosition(userId: string): Promise<INetPosition> {
    const uid = new Types.ObjectId(userId);
    const [acctAgg, recvAgg, payAgg] = await Promise.all([
      Account.aggregate([
        { $match: { user: uid, isActive: true } },
        { $group: { _id: null, liquid: { $sum: '$balance' } } },
      ]),
      Entry.aggregate([
        { $match: { user: uid, type: 'receivable' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payable.aggregate([
        { $match: { user: uid, status: 'open' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$principal', '$paidAmount'] } } } },
      ]),
    ]);
    const liquid         = acctAgg[0]?.liquid ?? 0;
    const receivableOpen = recvAgg[0]?.total  ?? 0;
    const payableOpen    = payAgg[0]?.total   ?? 0;
    return { liquid, receivableOpen, payableOpen, netPosition: liquid + receivableOpen - payableOpen };
  }
}
