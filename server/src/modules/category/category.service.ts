import { Types } from 'mongoose';
import { Category } from './category.model';
import { ICategory, ICategoryInput, EntryType } from '../../shared/types';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/utils/errors';

const DEFAULT_CATEGORIES: ICategoryInput[] = [
  { name: 'Salary',      icon: '💼', color: '#4a7c59', type: 'income',  isDefault: true },
  { name: 'Freelance',   icon: '💻', color: '#2a6dc2', type: 'income',  isDefault: true },
  { name: 'Business',    icon: '🏪', color: '#d4973e', type: 'income',  isDefault: true },
  { name: 'Gift',        icon: '🎁', color: '#9b59b6', type: 'income',  isDefault: true },
  { name: 'Other',       icon: '💰', color: '#7f8c8d', type: 'income',  isDefault: true },
  { name: 'Home',        icon: '🏠', color: '#c2552a', type: 'expense', isDefault: true },
  { name: 'Food',        icon: '🍔', color: '#e67e22', type: 'expense', isDefault: true },
  { name: 'Transport',   icon: '🚌', color: '#2980b9', type: 'expense', isDefault: true },
  { name: 'Utility',     icon: '💡', color: '#f39c12', type: 'expense', isDefault: true },
  { name: 'Education',   icon: '🎓', color: '#8e44ad', type: 'expense', isDefault: true },
  { name: 'Health',      icon: '🏥', color: '#e74c3c', type: 'expense', isDefault: true },
  { name: 'Shopping',    icon: '🛍️', color: '#e91e63', type: 'expense', isDefault: true },
  { name: 'Entertainment',icon:'🎬', color: '#16a085', type: 'expense', isDefault: true },
  { name: 'Travel',      icon: '✈️', color: '#1abc9c', type: 'expense', isDefault: true },
  { name: 'Loan',        icon: '💳', color: '#c0392b', type: 'expense', isDefault: true },
  { name: 'Other',       icon: '📦', color: '#95a5a6', type: 'expense', isDefault: true },
  { name: 'Bank Savings',icon: '🏦', color: '#27ae60', type: 'savings', isDefault: true },
  { name: 'Mobile Savings',icon:'📱', color: '#f1c40f', type: 'savings', isDefault: true },
  { name: 'Other Savings',icon:'💰', color: '#e67e22', type: 'savings', isDefault: true },
  { name: 'Loan Payable', icon: '📤', color: '#e74c3c', type: 'payable', isDefault: true },
  { name: 'Bill Payable', icon: '📄', color: '#f39c12', type: 'payable', isDefault: true },
  { name: 'Other Payable',icon: '📦', color: '#95a5a6', type: 'payable', isDefault: true },
  { name: 'Loan Receivable',icon:'📥', color: '#27ae60', type: 'receivable', isDefault: true },
  { name: 'Payment Receivable',icon:'💳', color: '#3498db', type: 'receivable', isDefault: true },
  { name: 'Other Receivable',icon:'💰', color: '#9b59b6', type: 'receivable', isDefault: true },
];

export const categoryService = {
  async seedDefaults(userId: Types.ObjectId): Promise<void> {
    const docs = DEFAULT_CATEGORIES.map((c) => ({ ...c, user: userId }));
    await Category.insertMany(docs, { ordered: false }).catch(() => {
      // ignore duplicate errors on re-seed
    });
  },

  async list(userId: string, type?: EntryType): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { user: userId };
    if (type) filter.type = type;
    return Category.find(filter).sort({ isDefault: -1, name: 1 });
  },

  async create(userId: string, dto: { name: string; icon?: string; color?: string; type: EntryType }): Promise<ICategory> {
    const exists = await Category.findOne({ user: userId, name: dto.name, type: dto.type });
    if (exists) throw new ConflictError('Category with this name already exists');
    return Category.create({ ...dto, user: userId, isDefault: false });
  },

  async update(userId: string, id: string, dto: Partial<{ name: string; icon: string; color: string }>): Promise<ICategory> {
    const cat = await Category.findById(id);
    if (!cat) throw new NotFoundError('Category');
    if (String(cat.user) !== userId) throw new ForbiddenError();
    Object.assign(cat, dto);
    return cat.save();
  },

  async remove(userId: string, id: string): Promise<void> {
    const cat = await Category.findById(id);
    if (!cat) throw new NotFoundError('Category');
    if (String(cat.user) !== userId) throw new ForbiddenError();
    if (cat.isDefault) throw new ForbiddenError('Cannot delete default categories');
    await cat.deleteOne();
  },
};
