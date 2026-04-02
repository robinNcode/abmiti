import { IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult } from '../../shared/types';
export declare const entryRepository: {
    findMany(userId: string, filters: IEntryFilters, pagination: IPaginationOptions): Promise<IPaginatedResult<IEntry>>;
    findById(id: string, userId: string): Promise<IEntry | null>;
    create(data: Partial<IEntry>): Promise<IEntry>;
    update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null>;
    remove(id: string, userId: string): Promise<boolean>;
};
//# sourceMappingURL=entry.repository.d.ts.map