# Abmiti — Gemini CLI / Antigravity

Personal finance tracker (Abmiti / আয় ব্যয় মিতি). This file is the Gemini and Google Antigravity entry point.

**Read and follow @AGENTS.md.** Human setup and API tables: @README.md. Flutter shell: @mobile/README.md.

## Quick context

- `client/` — Vite React SPA, `base` `/abmiti/`, TanStack Query, Zustand, Tailwind (terra/sage/mustard/paper/ink), react-i18next (en + bn).
- `server/` — Express modules, JWT + optional Google OAuth, SSLCommerz, `DB_PROVIDER=mysql|mongodb`.
- `mobile/` — Flutter WebView of the hosted web app.

## Non-negotiables

1. Implement data access on **both** database providers when touching repositories.
2. Keep admin role assignment offline (SQL/Mongo update), not a public API.
3. Do not commit secrets or expand JSON body limits without a documented reason.
4. User-facing strings need both locales.
5. Do not rebuild finance screens in Flutter; change the React app instead.
