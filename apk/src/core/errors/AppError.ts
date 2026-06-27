// src/core/errors/AppError.ts

export class AppError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export class UnauthorizedError extends AppError {
    constructor() {
        super('UNAUTHORIZED', 'Session expired. Please log in again.');
    }
}

export class NetworkError extends AppError {
    constructor() {
        super('NETWORK_ERROR', 'No internet connection.');
    }
}

export class ServerError extends AppError {
    constructor(message = 'Something went wrong. Please try again.') {
        super('SERVER_ERROR', message);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super('VALIDATION_ERROR', message);
    }
}
