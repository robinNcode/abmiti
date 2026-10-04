"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const google_auth_service_1 = require("./google-auth.service");
const response_1 = require("../../shared/utils/response");
const env_1 = require("../../config/env");
exports.authController = {
    async register(req, res, next) {
        try {
            const { user, tokens } = await auth_service_1.authService.register(req.body);
            (0, response_1.sendCreated)(res, {
                user: { _id: user._id, name: user.name, email: user.email, budget: user.budget, avatar: user.avatar, userType: user.userType ?? 'user' },
                ...tokens,
            }, 'Registration successful');
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { user, tokens } = await auth_service_1.authService.login(req.body);
            (0, response_1.sendSuccess)(res, {
                user: { _id: user._id, name: user.name, email: user.email, budget: user.budget, avatar: user.avatar, userType: user.userType ?? 'user' },
                ...tokens,
            }, 'Login successful');
        }
        catch (err) {
            next(err);
        }
    },
    async updateMe(req, res, next) {
        try {
            const user = await auth_service_1.authService.updateMe(req.user.userId, req.body);
            (0, response_1.sendSuccess)(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget, avatar: user.avatar, userType: user.userType ?? 'user' }, 'Profile updated');
        }
        catch (err) {
            next(err);
        }
    },
    async refresh(req, res, next) {
        try {
            const tokens = await auth_service_1.authService.refresh(req.body.refreshToken);
            (0, response_1.sendSuccess)(res, tokens, 'Token refreshed');
        }
        catch (err) {
            next(err);
        }
    },
    async me(req, res, next) {
        try {
            const user = await auth_service_1.authService.getMe(req.user.userId);
            (0, response_1.sendSuccess)(res, { _id: user._id, name: user.name, email: user.email, budget: user.budget, avatar: user.avatar, userType: user.userType ?? 'user' });
        }
        catch (err) {
            next(err);
        }
    },
    async googleAuth(req, res, next) {
        try {
            const url = google_auth_service_1.googleAuthService.getAuthorizationUrl();
            res.redirect(url);
        }
        catch (err) {
            next(err);
        }
    },
    async googleCallback(req, res, next) {
        try {
            const { code, state, error } = req.query;
            if (error) {
                res.redirect(`${env_1.env.GOOGLE_FRONTEND_CALLBACK_URL}?error=${encodeURIComponent(error)}`);
                return;
            }
            if (!code || !state) {
                res.redirect(`${env_1.env.GOOGLE_FRONTEND_CALLBACK_URL}?error=${encodeURIComponent('Missing authorization code or state')}`);
                return;
            }
            const { user, tokens, accountLinkingRequired } = await google_auth_service_1.googleAuthService.handleCallback(code, state);
            // We need to send tokens back to the frontend.
            // Redirecting with tokens in the URL is common for this setup (though query params is less secure than hash/short-lived-token).
            // Since requirements ask to avoid exposing JWT in URL, we could set them as HttpOnly cookies or use a short-lived auth code.
            // However, the existing app uses JSON responses with tokens.
            // A common pattern when redirecting to a SPA is to pass a short-lived token or use `#` fragment (which isn't sent to server) or postMessage.
            // Let's use a URL fragment so it doesn't get logged in server logs.
            const redirectUrl = new URL(env_1.env.GOOGLE_FRONTEND_CALLBACK_URL);
            redirectUrl.hash = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
            res.redirect(redirectUrl.toString());
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            res.redirect(`${env_1.env.GOOGLE_FRONTEND_CALLBACK_URL}?error=${encodeURIComponent(msg)}`);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map