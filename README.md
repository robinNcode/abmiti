# Abmiti — আয় ব্যয় মিতি

**Halal-friendly personal finance tracker** for Bangladesh-first money habits: income, expenses, savings, investments, payables, receivables, and monthly budgets — plus SMS parsing for bank / bKash / Nagad, bilingual UI (English + বাংলা), and a Flutter WebView app.

Live web app: [voltwavebd.com/abmiti](https://voltwavebd.com/abmiti/)

AI coding agents (Cursor, Claude Code, Codex, Gemini / Antigravity, Copilot) should follow **[AGENTS.md](./AGENTS.md)**.

---

## Vision

Abmiti exists so a household can see **where money actually went** against a **named monthly plan**, without interest-first product framing. New users start from a pre-seeded, fully editable halal budget (living cost, investment, family, fun, emergency, sadaqah). The product is one codebase with three surfaces:

| Surface | Role |
|---------|------|
| **Web client** (`client/`) | React SPA at basename `/abmiti/` — landing, blog, auth, tracker, admin |
| **API** (`server/`) | Express TypeScript API with MongoDB **or** MySQL behind the same repository interfaces |
| **Mobile** (`mobile/`) | Flutter shell that loads the production web app in a branded WebView |

---

## Features

- **Ledger** — Income, expense, savings, investment, payable, receivable entries with categories, payment sources, and optional account links.
- **Budgets** — Monthly plans with named lines (fixed or percentage), category links, sub-items, templates, copy-to-month, and planned vs. actual variance.
- **Halal default template** — Living Cost 50% · Investment 25% · Wife Expenses 10% · Fun 5% · Emergency 5% · Sadaqah 5% (editable).
- **SMS parsing** — Create entries from bank, bKash, and Nagad SMS text.
- **Accounts** — Bank and mobile money (bKash, Nagad, Rocket) with balances.
- **Dashboard & analytics** — Monthly/yearly totals, category breakdown, trends, budget health, category report, transaction statement.
- **Auth** — Email/password JWT (access + refresh with client auto-renewal) and Google OAuth.
- **Public site** — Configurable landing, blog, contact form, AdSense slots.
- **Admin** — Users, blog, contacts, notifications, payments/subscriptions, site config. Role is **not** self-serve; promote in the database.
- **Billing** — SSLCommerz checkout; plan prices are fixed on the server (coffee / monthly / annual).
- **i18n** — English and Bengali via `react-i18next`.
- **Responsive web** — Tailwind breakpoints from 375px (`xs`) upward; brand palette (terra, sage, mustard, paper, ink).
- **Native shell** — Splash, offline screen, back / double-back-to-exit, haptics bridge, custom `AbmitiApp` user-agent.

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router (`basename=/abmiti`) |
| Data fetching | TanStack Query + Axios (`apiClient` with refresh interceptor) |
| Client state | Zustand — `authStore`, `monthStore`, `budgetStore` |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL (`mysql2`) **or** MongoDB (`mongoose`) via `DB_PROVIDER` |
| Auth | JWT access + refresh; optional Google OAuth 2.0 |
| Payments | SSLCommerz (credentials stay on the server; validate IPN/callback server-side) |
| i18n | react-i18next (`client/src/i18n.ts`) |
| Mobile | Flutter WebView (`mobile/`) |

### SOLID / dual-database

- Each domain lives in `server/src/modules/<name>/` (routes, controller, service, validators, model).
- Controllers depend on services; services depend on **repository interfaces** in `server/src/shared/types/repositories.ts`.
- `server/src/container.ts` injects Mongo **or** MySQL implementations from `DB_PROVIDER`. Do not query the driver from controllers.
- SMS parsers are strategy-style and extensible without changing entry CRUD.

### Project tree

```
abmiti/
├── AGENTS.md                    # Canonical instructions for AI agents
├── CLAUDE.md                    # Claude Code
├── GEMINI.md                    # Gemini CLI / Antigravity
├── client/                      # React + Vite SPA
│   └── src/
│       ├── api/                 # Axios modules (auth, entries, budget, site…)
│       ├── components/          # layout, entry, budget, charts, ui, admin…
│       ├── pages/               # public, app, and admin routes
│       ├── hooks/               # React Query hooks
│       ├── store/               # Zustand
│       ├── utils/               # SMS parser helpers, formatters, image URLs
│       └── i18n.ts
├── server/                      # Express API
│   └── src/
│       ├── config/              # env, logger, database
│       ├── modules/             # auth, entry, category, account, summary, budget, admin
│       ├── infrastructure/
│       │   ├── database/        # mongodb/ + mysql/ (schema.sql + migrations/)
│       │   └── repositories/    # mongodb/ + mysql/ implementations
│       ├── shared/              # middleware, types, utils
│       ├── container.ts
│       ├── routes.ts
│       └── app.ts
└── mobile/                      # Flutter WebView (Android + iOS)
    └── lib/
        ├── core/constants/
        ├── features/webview/
        └── shared/{widgets,services}/
```

---

## Web routes

Router basename is **`/abmiti`**.

| Path | Access |
|------|--------|
| `/`, `/blog/:slug` | Public landing + blog |
| `/login`, `/register`, `/auth/google/callback` | Auth |
| `/dashboard`, `/entries`, `/budget`, `/categories`, `/analytics`, `/investments`, `/settings`, `/profile`, `/support`, `/category-report`, `/transaction-statement` | Signed-in user |
| `/admin`, `/admin/users`, `/admin/blog`, `/admin/contacts`, `/admin/notifications`, `/admin/payments`, `/admin/config` | `userType === 'admin'` |

---

## API

Default prefix: `/api/v1`. Health: `GET /health`. JSON envelope: `{ success, data, message, meta? }`.

Protected routes send `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Access + refresh tokens |
| POST | `/auth/refresh` | Rotate access token |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |

### Entries

| Method | Path | Description |
|--------|------|-------------|
| GET | `/entries` | List (filters: type, month, year, category, source, page) |
| POST | `/entries` | Create |
| GET | `/entries/:id` | Get one |
| PATCH | `/entries/:id` | Update |
| DELETE | `/entries/:id` | Delete |
| POST | `/entries/parse-sms` | Parse SMS → suggested entry |

### Categories & accounts

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/categories` | List / create |
| PATCH/DELETE | `/categories/:id` | Update / delete |
| GET/POST | `/accounts` | List / create |
| GET/PUT/DELETE | `/accounts/:id` | Get / update / delete |

### Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary/monthly` | Monthly totals (`?month=&year=`) |
| GET | `/summary/yearly` | Yearly trend series |
| GET | `/summary/yearly-summary` | Yearly totals |
| GET | `/summary/categories` | Category breakdown |
| GET | `/summary/accounts` | Per-account savings |
| GET | `/summary/budget-warnings` | Over-budget signals |
| GET | `/summary/category-report` | Filtered category report |
| GET | `/summary/transaction-statement` | Statement for a date range |

### Budgets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/budgets` | Budget for `?month=&year=` (seeds default on first use) |
| POST | `/budgets` | Create monthly budget |
| GET | `/budgets/list/all` | List budgets |
| PUT/DELETE | `/budgets/:id` | Update / delete |
| POST | `/budgets/:id/copy` | Clone to `?toMonth=&toYear=` |
| GET | `/budgets/templates` | Saved templates |
| POST | `/budgets/:id/save-as-template` | Save as template |
| POST | `/budgets/from-template/:templateId` | Apply template |
| DELETE | `/budgets/templates/:id` | Delete template |
| POST/PUT/DELETE | `/budgets/:id/lines`… | Line CRUD |
| PATCH | `/budgets/:id/lines/reorder` | Reorder lines |
| GET | `/budgets/:id/summary` | Planned vs actual |
| GET | `/budgets/:id/summary/line/:lineId` | Entries for one line |

### Public content, notifications, payments, admin

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/public-config` | Public | Landing/site config |
| GET | `/public-posts`, `/public-posts/:slug` | Public | Blog |
| POST | `/contact` | Public | Contact / feedback |
| GET/PATCH/DELETE | `/notifications`… | Auth | In-app notifications |
| GET | `/subscriptions` | Auth | Current user plans |
| POST | `/payments/start` | Auth | Start SSLCommerz session |
| POST/GET | `/payments/callback`, `/payments/ipn` | Gateway | SSLCommerz callbacks (no JWT; verify with SSLCommerz) |
| GET/PUT… | `/admin/*`, `/posts`, `/contacts`, `/config` | Admin | Dashboard, users, CMS, payments, config |

---

## Domain models

| Model | Key fields |
|-------|------------|
| User | name, email, password (bcrypt) or google_id, avatar, userType (`user` \| `admin`) |
| Entry | type, amount, note, category, source, account?, date, parsedFromSms, rawSms? |
| Category | name, icon, color, type, isDefault |
| Account | name, type (`bank` \| `mobile`), accountNumber, bankName, provider, balance, isActive |
| Budget | month, year, totalIncome, lines[], isTemplate, templateName, notes |
| BudgetLine | name, icon, color, allocationMethod (`percentage` \| `fixed`), allocationValue, linkedCategoryIds, subItems[], order, isActive |

Entry types: `income` | `expense` | `savings` | `investment` | `payable` | `receivable`.  
Sources: `bank` | `bkash` | `nagad` | `cash` | `card` | `other`.

### Budget rules

- One active (non-template) budget per user per month/year.
- Allocation totals may be under or over 100% (advisory, not blocked).
- A category maps to at most one line per budget. Matching uses `linkedCategoryIds`; sub-items are informational.
- Deleting a line does not delete entries.

### Budget health colors

| Status | Threshold | Color |
|--------|-----------|-------|
| On track | ≤ 80% used | Sage `#4A7C59` |
| Warning | 80–100% | Mustard `#D4973E` |
| Over budget | > 100% | Terra `#C2552A` |

---

## Setup

Requires **Node.js 20+**. Default API port **5000**, Vite **5173**.

### Server

```bash
cd server
npm install
cp .env.example .env   # fill secrets; never commit real credentials
npm run migrate:mysql  # when DB_PROVIDER=mysql
npm run dev
```

Important environment variables (see `server/.env.example`):

```env
NODE_ENV=development
PORT=5000
DB_PROVIDER=mysql          # or mongodb
MONGO_URI=mongodb://localhost:27017/abmiti
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=abmiti
JWT_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URLS=http://localhost:5173,http://localhost:4173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
GOOGLE_FRONTEND_CALLBACK_URL=http://localhost:5173/abmiti/auth/google/callback
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_SANDBOX=true
```

MySQL migrations live in `server/src/infrastructure/database/mysql/migrations/` (`000` … `013`). `npm run migrate:mysql` applies them in order. You can also load the full `schema.sql` on a fresh database.

### Client

```bash
cd client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api/v1/
npm run dev
```

Open `http://localhost:5173/abmiti/`. Vite proxies `/api` to the server. Optional AdSense vars: `VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_HERO_SLOT_ID`, `VITE_ADSENSE_SIDEBAR_SLOT_ID`, `VITE_ADSENSE_FOOTER_SLOT_ID`.

### Promote an admin

There is **no** public admin registration. After the first user exists:

```sql
UPDATE users SET user_type = 'admin' WHERE email = 'owner@example.com';
```

MongoDB:

```js
db.users.updateOne({ email: 'owner@example.com' }, { $set: { userType: 'admin' } })
```

Sign in again so the JWT includes `userType`.

### Mobile

```bash
cd mobile
flutter pub get
flutter run
flutter build apk --release
flutter build appbundle --release
```

The WebView loads the hosted SPA (`https://voltwavebd.com/abmiti/…`). Details, signing, and the JS bridge (`window.AbmitiNative.postMessage('HAPTIC')`) are in [mobile/README.md](./mobile/README.md).

### Docker

`client/Dockerfile` (nginx + Vite `base: /abmiti/`) and `server/Dockerfile` (Node 20, `node dist/app.js`) are available for production-style builds.

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run dev` | ts-node-dev API |
| `server/` | `npm run build` / `npm start` | Compile and run `dist/app.js` |
| `server/` | `npm run migrate:mysql` | Apply MySQL migrations |
| `client/` | `npm run dev` | Vite |
| `client/` | `npm run build` | `tsc` + Vite production build |
| `mobile/` | `flutter run` / `flutter analyze` | Run / lint |

---

## License

© 2026 VoltWave BD. All rights reserved.
