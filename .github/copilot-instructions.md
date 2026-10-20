# Abmiti — GitHub Copilot

Follow the repo-root **AGENTS.md**. This file is a short copy for Copilot Chat / coding agent.

Abmiti is a halal-friendly finance tracker: React (`client/`, basename `/abmiti/`), Express (`server/`, `/api/v1`), Flutter WebView (`mobile/`). Switch DB with `DB_PROVIDER` (mysql | mongodb). Repositories must stay substitutable; change Mongo **and** MySQL implementations plus `server/src/container.ts`.

- Modules: `server/src/modules/<name>/` — validators, controller, service; persist via `shared/types/repositories.ts`.
- Client: API in `src/api`, server state in TanStack Query hooks, UI session in Zustand. Alias `@/`.
- Add i18n keys in both `en` and `bn` in `client/src/i18n.ts`.
- Brand colors: terra `#C2552A`, sage `#4A7C59`, mustard `#D4973E`, paper `#FDF6EC`, ink `#1A1208`.
- No public admin registration. SSLCommerz prices and payment verification stay on the server.
- Do not duplicate the ledger in Dart. Do not commit `.env` or payment/OAuth secrets.
