# Abmiti — Claude Code

আয় ব্যয় মিতি — halal-friendly personal finance tracker (React + Express + Mongo/MySQL + Flutter WebView).

Follow **@AGENTS.md** for architecture, commands, and invariants. Product overview: **@README.md**. Mobile shell: **@mobile/README.md**.

## Session defaults

- Work in `client/`, `server/`, or `mobile/` — there is no root npm workspace.
- Dual database: repository interfaces + both Mongo and MySQL implementations + `container.ts`.
- SPA lives under `/abmiti/`. API default prefix `/api/v1`.
- i18n: every new UI string in English **and** Bengali in `client/src/i18n.ts`.
- No public admin signup; promote `user_type` / `userType` in the database.
- Payments: SSLCommerz verification on the server only.

## Pointers

| Task | Start here |
|------|------------|
| API module | `server/src/modules/` |
| Repos | `server/src/shared/types/repositories.ts`, `infrastructure/repositories/` |
| Web routes | `client/src/App.tsx` |
| Query hooks | `client/src/hooks/` |
| Env | `server/src/config/env.ts`, `server/.env.example` |
