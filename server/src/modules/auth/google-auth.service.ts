import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError, ConflictError, UnauthorizedError } from '../../shared/utils/errors';
import { AuthTokens, IUser } from '../../shared/types';
import { container } from '../../container';
import { authService, signTokensForUser } from './auth.service';

// ── Types ────────────────────────────────────────────────────
interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;           // Google's stable user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// ── In-memory CSRF state store (TTL: 10 minutes) ─────────────
const pendingStates = new Map<string, { createdAt: number }>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanExpiredStates() {
  const now = Date.now();
  for (const [key, val] of pendingStates) {
    if (now - val.createdAt > STATE_TTL_MS) pendingStates.delete(key);
  }
}

// ── Service ──────────────────────────────────────────────────
export const googleAuthService = {
  /**
   * Generate the Google OAuth consent URL with a CSRF-safe state parameter.
   */
  getAuthorizationUrl(): string {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new AppError('Google OAuth is not configured', 500);
    }

    cleanExpiredStates();

    const state = crypto.randomBytes(32).toString('hex');
    pendingStates.set(state, { createdAt: Date.now() });

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      state,
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Validate state and exchange auth code for tokens + user info.
   * Returns the application's JWT tokens.
   */
  async handleCallback(code: string, state: string): Promise<{
    user: IUser;
    tokens: AuthTokens;
    isNewUser: boolean;
    accountLinkingRequired?: boolean;
  }> {
    // 1. Validate CSRF state
    cleanExpiredStates();
    if (!state || !pendingStates.has(state)) {
      throw new UnauthorizedError('Invalid or expired OAuth state. Please try again.');
    }
    pendingStates.delete(state);

    // 2. Exchange code for tokens
    const tokenData = await this.exchangeCodeForTokens(code);

    // 3. Get user info from Google
    const googleUser = await this.getUserInfo(tokenData.access_token);

    // 4. Validate Google identity
    if (!googleUser.email_verified) {
      throw new UnauthorizedError('Google account email is not verified.');
    }
    if (!googleUser.sub || !googleUser.email) {
      throw new UnauthorizedError('Could not retrieve identity from Google.');
    }

    // 5. Find or create user
    return this.findOrCreateUser(googleUser);
  },

  /**
   * Exchange authorization code for access/id tokens.
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorData = await res.text();
      logger.error('Google token exchange failed', { status: res.status, body: errorData });
      throw new UnauthorizedError('Failed to authenticate with Google. Please try again.');
    }

    return res.json() as Promise<GoogleTokenResponse>;
  },

  /**
   * Fetch user profile from Google's userinfo endpoint.
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      logger.error('Google userinfo request failed', { status: res.status });
      throw new UnauthorizedError('Failed to retrieve user info from Google.');
    }

    return res.json() as Promise<GoogleUserInfo>;
  },

  /**
   * Core account resolution logic:
   * 1. Match by google_id (sub) → sign in directly
   * 2. Match by email → require explicit account linking
   * 3. No match → create new user
   */
  async findOrCreateUser(googleUser: GoogleUserInfo): Promise<{
    user: IUser;
    tokens: AuthTokens;
    isNewUser: boolean;
    accountLinkingRequired?: boolean;
  }> {
    // Case 1: User already linked via Google sub
    const existingByGoogleId = await container.userRepo.findByGoogleId(googleUser.sub);
    if (existingByGoogleId) {
      const tokens = signTokensForUser(existingByGoogleId);
      return { user: existingByGoogleId, tokens, isNewUser: false };
    }

    // Case 2: Email already exists but not linked to Google
    const existingByEmail = await container.userRepo.findByEmail(googleUser.email);
    if (existingByEmail) {
      // Signal that account linking is required instead of silently taking ownership
      throw new ConflictError(
        'An account with this email already exists. Please log in with your password first, then link your Google account from settings.'
      );
    }

    // Case 3: New user — register via Google
    const newUser = await container.userRepo.createFromGoogle({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.sub,
      avatar: googleUser.picture,
    });

    const tokens = signTokensForUser(newUser);
    return { user: newUser, tokens, isNewUser: true };
  },
};
