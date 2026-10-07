# Abmiti — agent instructions

Canonical guide for Cursor, Claude Code, Codex, Gemini / Antigravity, Copilot, and similar tools. Humans: see [README.md](./README.md).

## Product

Abmiti (আয় ব্যয় মিতি) is a **halal-friendly personal finance tracker**: ledger + monthly named budgets, Bangladesh payment rails (bank, bKash, Nagad, Rocket), EN/BN UI, public landing/blog, admin CMS, SSLCommerz billing, Flutter WebView shell.

Do not add interest-product, gambling, or riba-first framing. Keep the default budget template unless the user asks to change it.

## Layout

| Path | Stack |
|------|--------|
| `client/` | React 18, Vite (`base` and Router `basename` = `/abmiti/`), TypeScript, Tailwind, TanStack Query, Zustand, react-i18next |
| `server/` | Express + TypeScript, modules + repository interfaces, Mongo **or** MySQL |
| `mobile/` | Flutter WebView of the hosted SPA — not a separate native finance UI |

No monorepo root `package.json`. Work in the relevant package.

## Commands

```bash
cd server && npm install && npm run dev          # API :5000
cd server && npm run migrate:mysql               # MySQL only
cd client && npm install && npm run dev          # http://localhost:5173/abmiti/
cd mobile && flutter pub get && flutter analyze
```

Node 20+. Do not invent npm scripts at the repo root.

## Backend rules

- New features: `server/src/modules/<domain>/` with routes, validators (`express-validator`), controller, service. Register in `routes.ts` under `env.API_PREFIX` (default `/api/v1`).
- Persist only through interfaces in `shared/types/repositories.ts`. Implement **both** `infrastructure/repositories/mongodb/` and `mysql/` when a repo method changes. Wire in `container.ts`.
- Controllers: parse request, call service, `sendSuccess` / `sendCreated`. Do not open DB connections in controllers.
- Auth: `authenticate` on user data; `requireAdmin` on admin routes. Never add a public “register as admin” endpoint.
- Payments: prices stay server-side (`admin.controller.ts`). SSLCommerz callback/IPN must verify with the gateway; do not trust client-paid flags.
- JSON body limit is 10kb (`app.ts`); uploads go through admin image upload + `public/`.
- CORS uses `CLIENT_URLS` (origins only, no path). Env is loaded in `config/env.ts` — add new vars there, not scattered `process.env` reads.
- MySQL schema changes: new numbered file in `server/src/infrastructure/database/mysql/migrations/` plus `schema.sql` if it is the full snapshot.

## Frontend rules

- Pages in `client/src/pages/`; routes in `App.tsx`. Keep `/abmiti` basename.
- API in `client/src/api/*` via `apiClient`. Server state: TanStack Query hooks in `hooks/`. Session/month/budget UI state: Zustand stores.
- Alias `@/` → `client/src`.
- User-visible copy: add **both** `en` and `bn` keys in `i18n.ts`.
- Brand tokens from Tailwind: `terra`, `sage`, `mustard`, `ink`, `paper` — do not introduce a second palette.
- Verify UI in the browser when you change layout, routing, or client state. Check other pages that share that state.

## Mobile rules

- `mobile/` is a shell: WebView, connectivity, splash, haptics (`AbmitiNative`), external URL handling. Do not duplicate the React ledger in Dart.
- Production start URL is the hosted `/abmiti/` SPA. Document JS bridge changes in `mobile/README.md`.

## Product invariants

- Entry types: `income | expense | savings | investment | payable | receivable`.
- One non-template budget per user per month/year. Category → at most one line per budget. Sub-items do not drive actuals; `linkedCategoryIds` do.
- SMS parsing is additive; keep parsers extensible.
- Secrets stay in env files (gitignored). Never commit `.env`, keystores, or SSLCommerz/Google secrets. Do not copy real passwords from local `.env.example` into docs.

## How to change things

- Prefer matching existing module style over new frameworks.
- Dual-DB: if you cannot implement both repos in the same change, say so — do not ship a Mongo-only method that MySQL callers will hit.
- After edits: server `npm run build` (tsc) for type errors; client `npm run build` when types/routes change; `flutter analyze` for Dart.
