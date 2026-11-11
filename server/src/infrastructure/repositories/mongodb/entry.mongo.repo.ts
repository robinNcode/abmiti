import { FilterQuery, Types } from 'mongoose';
import { Entry } from '../../../modules/entry/entry.model';
import {
  IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult,
} from '../../../shared/types';
import { IEntryRepository } from '../../../shared/types/repositories';
import { buildPaginatedResult } from '../../../shared/utils/pagination';
import { transformUserData } from '../../../shared/utils/userDataEncryption';

const buildQuery = (userId: string, filters: IEntryFilters): FilterQuery<IEntry> => {
  const q: FilterQuery<IEntry> = { user: userId };
  if (filters.type)     q.type     = filters.type;
  if (filters.category) q.category = new Types.ObjectId(filters.category);
  if (filters.source)   q.source   = filters.source;

  if (filters.month !== undefined && filters.year !== undefined) {
    const start = new Date(filters.year, filters.month - 1, 1);
    const end   = new Date(filters.year, filters.month, 0, 23, 59, 59);
    q.date = { $gte: start, $lte: end };
  } else if (filters.startDate || filters.endDate) {
    q.date = {};
    if (filters.startDate) q.date.$gte = filters.startDate;
    if (filters.endDate)   q.date.$lte = filters.endDate;
  }
  return q;
};

export class MongoEntryRepository implements IEntryRepository {
  async findMany(
    userId: string,
    filters: IEntryFilters,
    pagination: IPaginationOptions,
  ): Promise<IPaginatedResult<IEntry>> {
    const query = buildQuery(userId, filters);
    const skip  = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      Entry.find(query)
        .populate('category', 'name icon color')
        .populate('account',  'name type accountNumber bankName provider balance')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit),
      Entry.countDocuments(query),
    ]);

    return buildPaginatedResult(
      data.map((entry) => transformUserData(userId, entry.toObject(), false) as IEntry),
      total,
      pagination,
    );
  }

  async findById(id: string, userId: string): Promise<IEntry | null> {
    const entry = await Entry.findOne({ _id: id, user: userId })
      .populate('category', 'name icon color')
      .populate('account',  'name type accountNumber bankName provider balance');
    return entry
      ? transformUserData(userId, entry.toObject(), false) as IEntry
      : null;
  }

  async create(data: Partial<IEntry>): Promise<IEntry> {
    const userId = String(data.user);
    const entry = await Entry.create(transformUserData(userId, data, true));
    const result = await Entry.findById(entry._id)
      .populate('category', 'name icon color')
      .populate('account',  'name type accountNumber bankName provider balance');
    return transformUserData(userId, result?.toObject(), false) as IEntry;
  }

  async update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null> {
    const entry = await Entry.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: transformUserData(userId, data, true) },
      { new: true, runValidators: true },
    )
      .populate('category', 'name icon color')
      .populate('account',  'name type accountNumber bankName provider balance');
    return entry
      ? transformUserData(userId, entry.toObject(), false) as IEntry
      : null;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await Entry.deleteOne({ _id: id, user: userId });
    return result.deletedCount === 1;
  }
}
