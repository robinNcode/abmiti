import { AuthTokens, IUser } from '../../shared/types';
interface RegisterDto {
    name: string;
    email: string;
    password: string;
}
interface LoginDto {
    email: string;
    password: string;
}
interface UpdateProfileDto {
    budget?: number;
    name?: string;
    avatar?: string;
}
export declare const signTokensForUser: (user: IUser) => AuthTokens;
export declare const authService: {
    signTokensForUser: (user: IUser) => AuthTokens;
    register(dto: RegisterDto): Promise<{
        user: IUser;
        tokens: AuthTokens;
    }>;
    login(dto: LoginDto): Promise<{
        user: IUser;
        tokens: AuthTokens;
    }>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    getMe(userId: string): Promise<IUser>;
    updateMe(userId: string, dto: UpdateProfileDto): Promise<IUser>;
};
export {};
//# sourceMappingURL=auth.service.d.ts.map