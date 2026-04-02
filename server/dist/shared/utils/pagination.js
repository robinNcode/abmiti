"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedResult = exports.parsePagination = void 0;
const parsePagination = (query, defaultLimit = 20) => ({
    page: Math.max(1, parseInt(String(query.page ?? 1), 10)),
    limit: Math.min(100, Math.max(1, parseInt(String(query.limit ?? defaultLimit), 10))),
});
exports.parsePagination = parsePagination;
const buildPaginatedResult = (data, total, { page, limit }) => ({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
exports.buildPaginatedResult = buildPaginatedResult;
//# sourceMappingURL=pagination.js.map