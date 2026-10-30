import { IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult } from '../../../shared/types';
import { IEntryRepository } from '../../../shared/types/repositories';
export declare class MongoEntryRepository implements IEntryRepository {
    findMany(userId: string, filters: IEntryFilters, pagination: IPaginationOptions): Promise<IPaginatedResult<IEntry>>;
    findById(id: string, userId: string): Promise<IEntry | null>;
    create(data: Partial<IEntry>): Promise<IEntry>;
    update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null>;
    remove(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=entry.mongo.repo.d.ts.map