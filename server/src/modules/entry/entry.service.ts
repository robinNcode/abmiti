import { container } from '../../container';
import { smsParserService } from '../../shared/utils/smsParser';
import { NotFoundError } from '../../shared/utils/errors';
import { Types } from 'mongoose';
import {
  IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult, ISmsParseResult,
} from '../../shared/types';
import { env } from '../../config/env';

interface CreateEntryDto {
  type: 'income' | 'expense' | 'investment' | 'savings' | 'payable' | 'receivable';
  amount: number;
  note?: string;
  categoryId: string;
  sector?: string;
  source?: string;
  accountId?: string;
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
    return container.entryRepo.findMany(userId, filters, pagination);
  },

  async getOne(userId: string, id: string): Promise<IEntry> {
    const entry = await container.entryRepo.findById(id, userId);
    if (!entry) throw new NotFoundError('Entry');
    return entry;
  },

  async create(userId: string, dto: CreateEntryDto): Promise<IEntry> {
    const category = await container.categoryRepo.findByUserAndId(userId, dto.categoryId);
    if (!category) throw new NotFoundError('Category');

    let account = null;
    if (dto.accountId) {
      account = await container.accountRepo.findById(userId, dto.accountId);
      if (!account) throw new NotFoundError('Account');
    }

    const isMongo = env.DB_PROVIDER === 'mongodb';
    return container.entryRepo.create({
      user:          (isMongo ? new Types.ObjectId(userId)           : userId)          as any,
      type:          dto.type,
      amount:        dto.amount,
      note:          dto.note ?? '',
      category:      (isMongo ? new Types.ObjectId(dto.categoryId)  : dto.categoryId)  as any,
      sector:        dto.sector ?? '',
      source:        (dto.source as IEntry['source']) ?? 'cash',
      account:       account
        ? (isMongo ? new Types.ObjectId(dto.accountId!) : dto.accountId!) as any
        : undefined,
      date:          dto.date ? new Date(dto.date) : new Date(),
      parsedFromSms: dto.parsedFromSms ?? false,
      rawSms:        dto.rawSms,
    });
  },

  async update(userId: string, id: string, dto: Partial<CreateEntryDto>): Promise<IEntry> {
    const existing = await container.entryRepo.findById(id, userId);
    if (!existing) throw new NotFoundError('Entry');

    const isMongo    = env.DB_PROVIDER === 'mongodb';
    const updateData: Partial<IEntry> = {};
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.note   !== undefined) updateData.note   = dto.note;
    if (dto.source !== undefined) updateData.source = dto.source as IEntry['source'];
    if (dto.date   !== undefined) updateData.date   = new Date(dto.date);
    if (dto.sector !== undefined) updateData.sector = dto.sector;

    if (dto.categoryId) {
      const cat = await container.categoryRepo.findByUserAndId(userId, dto.categoryId);
      if (!cat) throw new NotFoundError('Category');
      updateData.category = (isMongo ? new Types.ObjectId(dto.categoryId) : dto.categoryId) as any;
    }
    if (dto.accountId) {
      const acc = await container.accountRepo.findById(userId, dto.accountId);
      if (!acc) throw new NotFoundError('Account');
      updateData.account = (isMongo ? new Types.ObjectId(dto.accountId) : dto.accountId) as any;
    }

    const updated = await container.entryRepo.update(id, userId, updateData);
    if (!updated) throw new NotFoundError('Entry');
    return updated;
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await container.entryRepo.remove(id, userId);
    if (!deleted) throw new NotFoundError('Entry');
  },

  async parseSms(sms: string): Promise<ISmsParseResult> {
    return smsParserService.parse(sms);
  },

  async seedUserDefaults(userId: string): Promise<void> {
    const DEFAULT_CATEGORIES = [
      { name: 'Salary',              icon: '💼', color: '#4a7c59', type: 'income'      as const, isDefault: true },
      { name: 'Freelance',           icon: '💻', color: '#2a6dc2', type: 'income'      as const, isDefault: true },
      { name: 'Business',            icon: '🏪', color: '#d4973e', type: 'income'      as const, isDefault: true },
      { name: 'Gift',                icon: '🎁', color: '#9b59b6', type: 'income'      as const, isDefault: true },
      { name: 'Other',               icon: '💰', color: '#7f8c8d', type: 'income'      as const, isDefault: true },
      { name: 'Home',                icon: '🏠', color: '#c2552a', type: 'expense'     as const, isDefault: true },
      { name: 'Food',                icon: '🍔', color: '#e67e22', type: 'expense'     as const, isDefault: true },
      { name: 'Transport',           icon: '🚌', color: '#2980b9', type: 'expense'     as const, isDefault: true },
      { name: 'Utility',             icon: '💡', color: '#f39c12', type: 'expense'     as const, isDefault: true },
      { name: 'Education',           icon: '🎓', color: '#8e44ad', type: 'expense'     as const, isDefault: true },
      { name: 'Health',              icon: '🏥', color: '#e74c3c', type: 'expense'     as const, isDefault: true },
      { name: 'Shopping',            icon: '🛍️', color: '#e91e63', type: 'expense'     as const, isDefault: true },
      { name: 'Entertainment',       icon: '🎬', color: '#16a085', type: 'expense'     as const, isDefault: true },
      { name: 'Travel',              icon: '✈️', color: '#1abc9c', type: 'expense'     as const, isDefault: true },
      { name: 'Loan',                icon: '💳', color: '#c0392b', type: 'expense'     as const, isDefault: true },
      { name: 'Other',               icon: '📦', color: '#95a5a6', type: 'expense'     as const, isDefault: true },
      { name: 'Bank Savings',        icon: '🏦', color: '#27ae60', type: 'savings'     as const, isDefault: true },
      { name: 'Mobile Savings',      icon: '📱', color: '#f1c40f', type: 'savings'     as const, isDefault: true },
      { name: 'Other Savings',       icon: '💰', color: '#e67e22', type: 'savings'     as const, isDefault: true },
      { name: 'Loan Payable',        icon: '📤', color: '#e74c3c', type: 'payable'     as const, isDefault: true },
      { name: 'Bill Payable',        icon: '📄', color: '#f39c12', type: 'payable'     as const, isDefault: true },
      { name: 'Other Payable',       icon: '📦', color: '#95a5a6', type: 'payable'     as const, isDefault: true },
      { name: 'Loan Receivable',     icon: '📥', color: '#27ae60', type: 'receivable'  as const, isDefault: true },
      { name: 'Payment Receivable',  icon: '💳', color: '#3498db', type: 'receivable'  as const, isDefault: true },
      { name: 'Other Receivable',    icon: '💰', color: '#9b59b6', type: 'receivable'  as const, isDefault: true },
    ];
    await container.categoryRepo.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: userId })));
  },
};
