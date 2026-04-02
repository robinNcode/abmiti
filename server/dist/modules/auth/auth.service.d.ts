import { AuthTokens } from '../../shared/types';
import { IUser } from '../../shared/types';
interface RegisterDto {
    name: string;
    email: string;
    password: string;
}
interface LoginDto {
    email: string;
    password: string;
}
export declare const authService: {
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
};
export {};
//# sourceMappingURL=auth.service.d.ts.map