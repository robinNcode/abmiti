import { Types } from 'mongoose';
import { Entry } from '../../../modules/entry/entry.model';
import {
  ISummaryRepository, IMonthlySummaryRow, ICategoryBreakdownRow,
  IMonthlyTrendRow, IAccountSummaryRow,
} from '../../../shared/types/repositories';

export class MongoSummaryRepository implements ISummaryRepository {
  async getMonthlySummary(userId: string, start: Date, end: Date): Promise<IMonthlySummaryRow[]> {
    return Entry.aggregate([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getCategoryBreakdown(userId: string, start: Date, end: Date): Promise<ICategoryBreakdownRow[]> {
    return Entry.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $sort: { total: -1 } },
    ]);
  }

  async getYearlyTrend(userId: string, start: Date, end: Date): Promise<IMonthlyTrendRow[]> {
    return Entry.aggregate([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:   { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);
  }

  async getAccountSummaries(userId: string, year?: number): Promise<IAccountSummaryRow[]> {
    const match: any = { user: new Types.ObjectId(userId), type: 'savings' };
    if (year) {
      match.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    return Entry.aggregate([
      { $match: match },
      { $group: { _id: '$account', totalSavings: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $sort: { totalSavings: -1 } },
    ]);
  }
}
