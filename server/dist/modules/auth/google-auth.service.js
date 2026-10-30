"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const errors_1 = require("../../shared/utils/errors");
const container_1 = require("../../container");
const auth_service_1 = require("./auth.service");
// ── In-memory CSRF state store (TTL: 10 minutes) ─────────────
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;
function cleanExpiredStates() {
    const now = Date.now();
    for (const [key, val] of pendingStates) {
        if (now - val.createdAt > STATE_TTL_MS)
            pendingStates.delete(key);
    }
}
// ── Service ──────────────────────────────────────────────────
exports.googleAuthService = {
    /**
     * Generate the Google OAuth consent URL with a CSRF-safe state parameter.
     */
    getAuthorizationUrl() {
        if (!env_1.env.GOOGLE_CLIENT_ID || !env_1.env.GOOGLE_CLIENT_SECRET) {
            throw new errors_1.AppError('Google OAuth is not configured', 500);
        }
        cleanExpiredStates();
        const state = crypto_1.default.randomBytes(32).toString('hex');
        pendingStates.set(state, { createdAt: Date.now() });
        const params = new URLSearchParams({
            client_id: env_1.env.GOOGLE_CLIENT_ID,
            redirect_uri: env_1.env.GOOGLE_CALLBACK_URL,
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
    async handleCallback(code, state) {
        // 1. Validate CSRF state
        cleanExpiredStates();
        if (!state || !pendingStates.has(state)) {
            throw new errors_1.UnauthorizedError('Invalid or expired OAuth state. Please try again.');
        }
        pendingStates.delete(state);
        // 2. Exchange code for tokens
        const tokenData = await this.exchangeCodeForTokens(code);
        // 3. Get user info from Google
        const googleUser = await this.getUserInfo(tokenData.access_token);
        // 4. Validate Google identity
        if (!googleUser.email_verified) {
            throw new errors_1.UnauthorizedError('Google account email is not verified.');
        }
        if (!googleUser.sub || !googleUser.email) {
            throw new errors_1.UnauthorizedError('Could not retrieve identity from Google.');
        }
        // 5. Find or create user
        return this.findOrCreateUser(googleUser);
    },
    /**
     * Exchange authorization code for access/id tokens.
     */
    async exchangeCodeForTokens(code) {
        const body = new URLSearchParams({
            code,
            client_id: env_1.env.GOOGLE_CLIENT_ID,
            client_secret: env_1.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env_1.env.GOOGLE_CALLBACK_URL,
            grant_type: 'authorization_code',
        });
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) {
            const errorData = await res.text();
            logger_1.logger.error('Google token exchange failed', { status: res.status, body: errorData });
            throw new errors_1.UnauthorizedError('Failed to authenticate with Google. Please try again.');
        }
        return res.json();
    },
    /**
     * Fetch user profile from Google's userinfo endpoint.
     */
    async getUserInfo(accessToken) {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            logger_1.logger.error('Google userinfo request failed', { status: res.status });
            throw new errors_1.UnauthorizedError('Failed to retrieve user info from Google.');
        }
        return res.json();
    },
    /**
     * Core account resolution logic:
     * 1. Match by google_id (sub) → sign in directly
     * 2. Match by email → require explicit account linking
     * 3. No match → create new user
     */
    async findOrCreateUser(googleUser) {
        // Case 1: User already linked via Google sub
        const existingByGoogleId = await container_1.container.userRepo.findByGoogleId(googleUser.sub);
        if (existingByGoogleId) {
            const tokens = (0, auth_service_1.signTokensForUser)(existingByGoogleId);
            return { user: existingByGoogleId, tokens, isNewUser: false };
        }
        // Case 2: Email already exists but not linked to Google
        const existingByEmail = await container_1.container.userRepo.findByEmail(googleUser.email);
        if (existingByEmail) {
            // Signal that account linking is required instead of silently taking ownership
            throw new errors_1.ConflictError('An account with this email already exists. Please log in with your password first, then link your Google account from settings.');
        }
        // Case 3: New user — register via Google
        const newUser = await container_1.container.userRepo.createFromGoogle({
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.sub,
            avatar: googleUser.picture,
        });
        const tokens = (0, auth_service_1.signTokensForUser)(newUser);
        return { user: newUser, tokens, isNewUser: true };
    },
};
//# sourceMappingURL=google-auth.service.js.map