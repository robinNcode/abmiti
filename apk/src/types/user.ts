// src/types/user.ts
export interface User {
    _id: string;
    name: string;
    email: string;
    budget?: number;
    createdAt?: string;
    updatedAt?: string;
}
