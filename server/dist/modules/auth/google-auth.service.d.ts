import { AuthTokens, IUser } from '../../shared/types';
interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}
interface GoogleUserInfo {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}
export declare const googleAuthService: {
    /**
     * Generate the Google OAuth consent URL with a CSRF-safe state parameter.
     */
    getAuthorizationUrl(): string;
    /**
     * Validate state and exchange auth code for tokens + user info.
     * Returns the application's JWT tokens.
     */
    handleCallback(code: string, state: string): Promise<{
        user: IUser;
        tokens: AuthTokens;
        isNewUser: boolean;
        accountLinkingRequired?: boolean;
    }>;
    /**
     * Exchange authorization code for access/id tokens.
     */
    exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse>;
    /**
     * Fetch user profile from Google's userinfo endpoint.
     */
    getUserInfo(accessToken: string): Promise<GoogleUserInfo>;
    /**
     * Core account resolution logic:
     * 1. Match by google_id (sub) → sign in directly
     * 2. Match by email → require explicit account linking
     * 3. No match → create new user
     */
    findOrCreateUser(googleUser: GoogleUserInfo): Promise<{
        user: IUser;
        tokens: AuthTokens;
        isNewUser: boolean;
        accountLinkingRequired?: boolean;
    }>;
};
export {};
//# sourceMappingURL=google-auth.service.d.ts.map