import { container } from '../../container';
import { ICategory, EntryType } from '../../shared/types';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/utils/errors';
import { entryService } from '../entry/entry.service';

export const categoryService = {
  async list(userId: string, type?: EntryType): Promise<ICategory[]> {
    let list = await container.categoryRepo.findByUser(userId, type);
    if (list.length === 0) {
      const allCategories = await container.categoryRepo.findByUser(userId);
      if (allCategories.length === 0) {
        await entryService.seedUserDefaults(userId);
        list = await container.categoryRepo.findByUser(userId, type);
      }
    }
    return list;
  },

  async seed(userId: string): Promise<ICategory[]> {
    await entryService.seedUserDefaults(userId);
    return container.categoryRepo.findByUser(userId);
  },

  async create(userId: string, dto: { name: string; icon?: string; color?: string; type: EntryType }): Promise<ICategory> {
    const exists = await container.categoryRepo.findByNameAndType(userId, dto.name, dto.type);
    if (exists) throw new ConflictError('Category with this name already exists');
    return container.categoryRepo.create({
      name:      dto.name,
      icon:      dto.icon ?? '📦',
      color:     dto.color ?? '#c2552a',
      type:      dto.type,
      isDefault: false,
      user:      userId,
    });
  },

  async update(
    userId: string,
    id: string,
    dto: Partial<{ name: string; icon: string; color: string }>,
  ): Promise<ICategory> {
    const cat = await container.categoryRepo.findById(id);
    if (!cat) throw new NotFoundError('Category');
    if (String(cat.user) !== userId) throw new ForbiddenError();
    return container.categoryRepo.update(id, dto);
  },

  async remove(userId: string, id: string): Promise<void> {
    const cat = await container.categoryRepo.findById(id);
    if (!cat) throw new NotFoundError('Category');
    if (String(cat.user) !== userId) throw new ForbiddenError();
    if (cat.isDefault) throw new ForbiddenError('Cannot delete default categories');
    return container.categoryRepo.remove(id);
  },
};
