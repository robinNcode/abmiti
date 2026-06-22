import { Category } from '../../../modules/category/category.model';
import { ICategory, ICategoryInput, EntryType } from '../../../shared/types';
import { ICategoryRepository } from '../../../shared/types/repositories';

export class MongoCategoryRepository implements ICategoryRepository {
  async findByUser(userId: string, type?: EntryType): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { user: userId };
    if (type) filter.type = type;
    return Category.find(filter).sort({ isDefault: -1, name: 1 });
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async findByUserAndId(userId: string, id: string): Promise<ICategory | null> {
    return Category.findOne({ _id: id, user: userId });
  }

  async findByNameAndType(userId: string, name: string, type: EntryType): Promise<ICategory | null> {
    return Category.findOne({ user: userId, name, type });
  }

  async insertMany(docs: (ICategoryInput & { user: string })[]): Promise<void> {
    await Category.insertMany(docs, { ordered: false }).catch(() => {
      // ignore duplicate key errors on re-seed
    });
  }

  async create(data: ICategoryInput & { user: string }): Promise<ICategory> {
    return Category.create(data);
  }

  async update(
    id: string,
    data: Partial<{ name: string; icon: string; color: string }>,
  ): Promise<ICategory> {
    const cat = await Category.findById(id);
    if (!cat) throw new Error('Category not found');
    Object.assign(cat, data);
    return cat.save();
  }

  async remove(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }
}
