import { Category } from '../../../modules/category/category.model';
import { ICategory, ICategoryInput, EntryType } from '../../../shared/types';
import { ICategoryRepository } from '../../../shared/types/repositories';
import { transformUserData, userDataLookupHash } from '../../../shared/utils/userDataEncryption';

export class MongoCategoryRepository implements ICategoryRepository {
  async findByUser(userId: string, type?: EntryType): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { user: userId };
    if (type) filter.type = type;
    const docs = await Category.find(filter);
    return docs
      .map((doc) => transformUserData(userId, doc.toObject(), false) as ICategory)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<ICategory | null> {
    const doc = await Category.findById(id);
    return doc
      ? transformUserData(String(doc.user), doc.toObject(), false) as ICategory
      : null;
  }

  async findByUserAndId(userId: string, id: string): Promise<ICategory | null> {
    const doc = await Category.findOne({ _id: id, user: userId });
    return doc
      ? transformUserData(userId, doc.toObject(), false) as ICategory
      : null;
  }

  async findByNameAndType(userId: string, name: string, type: EntryType): Promise<ICategory | null> {
    const doc = await Category.findOne({
      user: userId,
      type,
      nameLookupHash: userDataLookupHash(userId, name),
    });
    return doc
      ? transformUserData(userId, doc.toObject(), false) as ICategory
      : null;
  }

  async insertMany(docs: (ICategoryInput & { user: string })[]): Promise<void> {
    const encrypted = await Promise.all(docs.map(async (doc) => {
      if (await this.findByNameAndType(doc.user, doc.name, doc.type)) return null;
      return {
        ...transformUserData(doc.user, doc, true),
        nameLookupHash: userDataLookupHash(doc.user, doc.name),
      };
    }));
    await Category.insertMany(encrypted.filter((doc) => doc !== null), { ordered: false }).catch(() => {
      // ignore duplicate key errors on re-seed
    });
  }

  async create(data: ICategoryInput & { user: string }): Promise<ICategory> {
    const doc = await Category.create({
      ...transformUserData(data.user, data, true),
      nameLookupHash: userDataLookupHash(data.user, data.name),
    });
    return transformUserData(data.user, doc.toObject(), false) as ICategory;
  }

  async update(
    id: string,
    data: Partial<{ name: string; icon: string; color: string }>,
  ): Promise<ICategory> {
    const cat = await Category.findById(id);
    if (!cat) throw new Error('Category not found');
    const userId = String(cat.user);
    const existing = transformUserData(userId, cat.toObject(), false) as ICategory;
    Object.assign(existing, data);
    await Category.updateOne(
      { _id: id },
      {
        $set: {
          ...transformUserData(userId, data, true),
          ...(data.name === undefined ? {} : { nameLookupHash: userDataLookupHash(userId, data.name) }),
        },
      },
    );
    return { ...existing, ...data } as ICategory;
  }

  async remove(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }
}
