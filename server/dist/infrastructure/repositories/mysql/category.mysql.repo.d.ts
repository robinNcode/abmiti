import { ICategory, ICategoryInput, EntryType } from '../../../shared/types';
import { ICategoryRepository } from '../../../shared/types/repositories';
export declare class MySQLCategoryRepository implements ICategoryRepository {
    private get pool();
    findByUser(userId: string, type?: EntryType): Promise<ICategory[]>;
    findById(id: string): Promise<ICategory | null>;
    findByUserAndId(userId: string, id: string): Promise<ICategory | null>;
    findByNameAndType(userId: string, name: string, type: EntryType): Promise<ICategory | null>;
    insertMany(docs: (ICategoryInput & {
        user: string;
    })[]): Promise<void>;
    create(data: ICategoryInput & {
        user: string;
    }): Promise<ICategory>;
    update(id: string, data: Partial<{
        name: string;
        icon: string;
        color: string;
    }>): Promise<ICategory>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=category.mysql.repo.d.ts.map