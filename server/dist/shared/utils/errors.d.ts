export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map