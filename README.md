# abmiti — আয় ব্যয় মিতি

> Personal finance tracker: Income · Expense · Savings

## Architecture

```
abmiti/
├── server/          # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── config/          # DB, env config
│   │   ├── modules/
│   │   │   ├── auth/        # JWT auth (register/login)
│   │   │   ├── entry/       # Income & Expense entries
│   │   │   ├── category/    # Expense categories
│   │   │   └── summary/     # Aggregated stats
│   │   ├── shared/
│   │   │   ├── middleware/  # auth, error, validate
│   │   │   ├── utils/       # sms-parser, response, paginate
│   │   │   └── types/       # shared TS types
│   │   └── app.ts
│   └── package.json
│
└── client/          # React + Vite + Tailwind
    ├── src/
    │   ├── api/             # Axios service layer
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Route pages
    │   ├── hooks/           # Custom React hooks
    │   ├── store/           # Zustand global state
    │   └── utils/           # sms parser, formatters
    └── package.json
```

## SOLID Principles Applied

- **S** — Each module (auth, entry, category, summary) has a single responsibility
- **O** — SMS parsers are extensible via strategy pattern (add new banks without changing core)
- **L** — All repository interfaces are substitutable
- **I** — Separate interfaces: `IEntryRepository`, `IAuthService`, `ISMSParser`
- **D** — Controllers depend on service abstractions, not concrete implementations

## API Endpoints

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET  /api/v1/auth/me`

### Entries
- `GET    /api/v1/entries` — list with filters (type, month, year, category, page)
- `POST   /api/v1/entries` — create entry
- `GET    /api/v1/entries/:id`
- `PATCH  /api/v1/entries/:id`
- `DELETE /api/v1/entries/:id`

### SMS Parse
- `POST /api/v1/entries/parse-sms` — parse bank/bKash/Nagad SMS

### Summary
- `GET /api/v1/summary/monthly?month=&year=`
- `GET /api/v1/summary/yearly?year=`
- `GET /api/v1/summary/categories?month=&year=`

### Categories
- `GET    /api/v1/categories`
- `POST   /api/v1/categories`
- `PATCH  /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

## Setup

```bash
# Server
cd server && npm install
cp .env.example .env   # fill MONGO_URI, JWT_SECRET
npm run dev

# Client
cd client && npm install
cp .env.example .env   # fill VITE_API_URL
npm run dev
```
