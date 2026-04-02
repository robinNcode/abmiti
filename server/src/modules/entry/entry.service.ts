import { entryRepository } from './entry.repository';
import { categoryService } from '../category/category.service';
import { smsParserService } from '../../shared/utils/smsParser';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import {
  IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult, ISmsParseResult,
} from '../../shared/types';
import { Category } from '../category/category.model';
import { Types } from 'mongoose';

interface CreateEntryDto {
  type: 'income' | 'expense';
  amount: number;
  note?: string;
  categoryId: string;
  source?: string;
  date?: string;
  parsedFromSms?: boolean;
  rawSms?: string;
}

export const entryService = {
  async list(
    userId: string,
    filters: IEntryFilters,
    pagination: IPaginationOptions,
  ): Promise<IPaginatedResult<IEntry>> {
    return entryRepository.findMany(userId, filters, pagination);
  },

  async getOne(userId: string, id: string): Promise<IEntry> {
    const entry = await entryRepository.findById(id, userId);
    if (!entry) throw new NotFoundError('Entry');
    return entry;
  },

  async create(userId: string, dto: CreateEntryDto): Promise<IEntry> {
    // Verify category belongs to user
    const category = await Category.findOne({ _id: dto.categoryId, user: userId });
    if (!category) throw new NotFoundError('Category');

    return entryRepository.create({
      user: new Types.ObjectId(userId),
      type: dto.type,
      amount: dto.amount,
      note: dto.note ?? '',
      category: new Types.ObjectId(dto.categoryId),
      source: (dto.source as IEntry['source']) ?? 'cash',
      date: dto.date ? new Date(dto.date) : new Date(),
      parsedFromSms: dto.parsedFromSms ?? false,
      rawSms: dto.rawSms,
    });
  },

  async update(userId: string, id: string, dto: Partial<CreateEntryDto>): Promise<IEntry> {
    const existing = await entryRepository.findById(id, userId);
    if (!existing) throw new NotFoundError('Entry');

    const updateData: Partial<IEntry> = {};
    if (dto.amount !== undefined)  updateData.amount = dto.amount;
    if (dto.note   !== undefined)  updateData.note   = dto.note;
    if (dto.source !== undefined)  updateData.source = dto.source as IEntry['source'];
    if (dto.date   !== undefined)  updateData.date   = new Date(dto.date);
    if (dto.categoryId) {
      const cat = await Category.findOne({ _id: dto.categoryId, user: userId });
      if (!cat) throw new NotFoundError('Category');
      updateData.category = new Types.ObjectId(dto.categoryId);
    }

    const updated = await entryRepository.update(id, userId, updateData);
    if (!updated) throw new NotFoundError('Entry');
    return updated;
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await entryRepository.remove(id, userId);
    if (!deleted) throw new NotFoundError('Entry');
  },

  async parseSms(sms: string): Promise<ISmsParseResult> {
    return smsParserService.parse(sms);
  },

  async seedUserDefaults(userId: string): Promise<void> {
    await categoryService.seedDefaults(new Types.ObjectId(userId));
  },
};
