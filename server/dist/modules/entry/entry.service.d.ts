import { IEntry, IEntryFilters, IPaginationOptions, IPaginatedResult, ISmsParseResult } from '../../shared/types';
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
export declare const entryService: {
    list(userId: string, filters: IEntryFilters, pagination: IPaginationOptions): Promise<IPaginatedResult<IEntry>>;
    getOne(userId: string, id: string): Promise<IEntry>;
    create(userId: string, dto: CreateEntryDto): Promise<IEntry>;
    update(userId: string, id: string, dto: Partial<CreateEntryDto>): Promise<IEntry>;
    remove(userId: string, id: string): Promise<void>;
    parseSms(sms: string): Promise<ISmsParseResult>;
    seedUserDefaults(userId: string): Promise<void>;
};
export {};
//# sourceMappingURL=entry.service.d.ts.map