import { IPaginationOptions, IPaginatedResult } from '../types';
export declare const parsePagination: (query: Record<string, unknown>, defaultLimit?: number) => IPaginationOptions;
export declare const buildPaginatedResult: <T>(data: T[], total: number, { page, limit }: IPaginationOptions) => IPaginatedResult<T>;
//# sourceMappingURL=pagination.d.ts.map