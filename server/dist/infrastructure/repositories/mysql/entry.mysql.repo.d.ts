import { IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult } from '../../../shared/types';
import { IEntryRepository } from '../../../shared/types/repositories';
export declare class MySQLEntryRepository implements IEntryRepository {
    private get pool();
    findMany(userId: string, filters: IEntryFilters, pagination: IPaginationOptions): Promise<IPaginatedResult<IEntry>>;
    findById(id: string, userId: string): Promise<IEntry | null>;
    create(data: Partial<IEntry>): Promise<IEntry>;
    update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null>;
    remove(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=entry.mysql.repo.d.ts.map