import { IPaginationOptions, IPaginatedResult } from '../types';

export const parsePagination = (
  query: Record<string, unknown>,
  defaultLimit = 20,
): IPaginationOptions => ({
  page: Math.max(1, parseInt(String(query.page ?? 1), 10)),
  limit: Math.min(100, Math.max(1, parseInt(String(query.limit ?? defaultLimit), 10))),
});

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  { page, limit }: IPaginationOptions,
): IPaginatedResult<T> => ({
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
