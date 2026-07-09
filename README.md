# Abmiti - আয় ব্যয় মিতি
## Personal Finance Tracker

Abmiti is a modern, halal-friendly personal finance tracker built with React, Node.js, and MongoDB/MySQL. It helps you manage income, expenses, and monthly budgets effortlessly — with intelligent SMS parsing, multi-database support, and a native mobile app.

## 🚀 Features

- **Financial Tracking**: Monitor income, expenses, savings, investments, payables, and receivables.
- **Budget Management**: Define monthly budgets with named lines (fixed or percentage-based), sub-item breakdowns, and real-time planned vs. actual variance tracking.
- **Halal-Friendly Defaults**: New users get a pre-seeded halal budget template (Living Cost 50% · Investment 25% · Wife Expenses 10% · Fun 5% · Emergency 5% · Sadaqah 5%) — fully editable.
- **Budget Templates**: Save any budget as a reusable template and apply it to future months in one click.
- **AI-Powered SMS Parsing**: Automatically parses bank, bKash, and Nagad SMS messages to create entries.
- **Intuitive Dashboard**: Visualizes financial health with charts, summaries, and a Budget Health widget.
- **Category Management**: Organize entries with fully customizable categories linked to budget lines.
- **Account Management**: Track balances across bank accounts and mobile banking (bKash, Nagad, Rocket).
- **Multi-Database Support**: Switch between MongoDB and MySQL via a single environment variable (`DB_PROVIDER`).
- **Secure Authentication**: JWT access + refresh token system with auto-renewal.
- **Fully Responsive Web App**: Optimized for 375 px through 1440 px viewports.
- **Native Mobile App**: Flutter WebView shell with branded splash, back navigation, offline screen, and double-back-to-exit.
- **Bilingual UI**: Full English and Bengali (বাংলা) localization via react-i18next.

## 🛠️ Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) **or** MySQL (mysql2) — switchable via `DB_PROVIDER` |
| Auth | JWT (access + refresh tokens) |
| State | Zustand (`authStore`, `monthStore`, `budgetStore`) |
| API Client | Axios with auto token-refresh interceptor |
| i18n | react-i18next (English + Bengali) |
| Mobile | Flutter WebView (Android + iOS) |

### Project Tree

```
abmiti/
├── server/                          # Node.js + Express + TypeScript backend
│   └── src/
│       ├── config/                  # env.ts, logger.ts
│       ├── modules/
│       │   ├── auth/                # JWT register/login/refresh
│       │   ├── entry/               # Income & expense entries + SMS parse
│       │   ├── category/            # User-defined categories
│       │   ├── account/             # Bank & mobile banking accounts
│       │   ├── summary/             # Aggregated stats (monthly, yearly, trend)
│       │   └── budget/              # Budget plans, lines, templates, summaries
│       ├── infrastructure/
│       │   ├── database/
│       │   │   ├── mongodb/         # Mongoose connection
│       │   │   └── mysql/           # mysql2 pool + schema.sql
│       │   └── repositories/
│       │       ├── mongodb/         # Mongo implementations of all repo interfaces
│       │       └── mysql/           # MySQL implementations of all repo interfaces
│       ├── shared/
│       │   ├── middleware/          # auth, error, rateLimiter, notFound
│       │   ├── types/               # Domain interfaces + repository contracts
│       │   └── utils/               # pagination, errors, response helpers
│       ├── container.ts             # DI container — wires repos based on DB_PROVIDER
│       ├── routes.ts                # Central route registry
│       └── app.ts                   # Express bootstrap
│
├── client/                          # React + Vite frontend
│   └── src/
│       ├── api/                     # Axios calls per resource (auth, entries, budget…)
│       ├── components/
│       │   ├── layout/              # AppLayout, AuthLayout, sidebar, mobile nav
│       │   ├── entry/               # EntryRow, ExpenseForm, SmsEntryForm
│       │   ├── charts/              # CategoryBreakdown, trend charts
│       │   ├── budget/              # BudgetOverview, BudgetLineCard, BudgetLineForm,
│       │   │                        # BudgetSubItemList, BudgetTemplateSelector,
│       │   │                        # BudgetMonthNavigator
│       │   └── ui/                  # SummaryCard, Modal, PageHeader, Spinner, EmptyState
│       ├── pages/                   # Dashboard, Entries, Categories, Analytics,
│       │                            # Investments, Budget, Settings, Login, Register
│       ├── hooks/                   # useMonthlySummary, useEntries, useBudget…
│       ├── store/                   # authStore, monthStore, budgetStore (Zustand)
│       ├── utils/                   # sms-parser, formatters
│       └── i18n.ts                  # react-i18next setup (en + bn)
│
└── flutter_app/                     # Flutter mobile WebView shell
    └── lib/
        ├── core/constants/          # AppColors (brand palette)
        ├── features/webview/        # WebViewScreen + controller
        └── shared/
            ├── widgets/             # NoInternetScreen, LoadingOverlay
            └── services/            # ConnectivityService
```

## SOLID Principles Applied

- **S** — Each module (auth, entry, category, account, summary, budget) has a single responsibility
- **O** — SMS parsers are extensible via strategy pattern; budget templates extensible without touching core logic
- **L** — All repository interfaces (`IEntryRepository`, `IBudgetRepository`, …) are substitutable between MongoDB and MySQL implementations
- **I** — Separate interfaces: `IEntryRepository`, `IBudgetRepository`, `IAuthService`, `ISMSParser`
- **D** — Controllers depend on service abstractions; services depend on repository interfaces injected via `container.ts`

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |
| PATCH | `/api/v1/auth/me` | Update profile |

### Entries
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/entries` | List with filters (type, month, year, category, source, page) |
| POST | `/api/v1/entries` | Create entry |
| GET | `/api/v1/entries/:id` | Get entry by ID |
| PUT | `/api/v1/entries/:id` | Update entry |
| DELETE | `/api/v1/entries/:id` | Delete entry |
| POST | `/api/v1/entries/parse-sms` | Parse bank / bKash / Nagad SMS |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/:id` | Update category |
| DELETE | `/api/v1/categories/:id` | Delete category |

### Accounts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/accounts` | List accounts |
| POST | `/api/v1/accounts` | Create account |
| PUT | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Delete account |

### Summary
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/summary/monthly` | Monthly income / expense / savings totals |
| GET | `/api/v1/summary/yearly` | Yearly totals |
| GET | `/api/v1/summary/categories` | Expense breakdown by category |
| GET | `/api/v1/summary/trend` | 12-month income / expense trend |
| GET | `/api/v1/summary/accounts` | Savings per account |

### Budget Plans
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/budgets` | Get budget for `?month=&year=` (auto-seeds halal default on first use) |
| POST | `/api/v1/budgets` | Create a new monthly budget |
| PUT | `/api/v1/budgets/:id` | Update budget (income, notes) |
| DELETE | `/api/v1/budgets/:id` | Delete a monthly budget |
| POST | `/api/v1/budgets/:id/copy` | Clone budget to `?toMonth=&toYear=` |

### Budget Lines
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/budgets/:id/lines` | Add a new budget line |
| PUT | `/api/v1/budgets/:id/lines/:lineId` | Edit a budget line |
| DELETE | `/api/v1/budgets/:id/lines/:lineId` | Remove a budget line |
| PATCH | `/api/v1/budgets/:id/lines/reorder` | Reorder lines (array of lineIds) |

### Budget Templates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/budgets/templates` | List saved templates |
| POST | `/api/v1/budgets/:id/save-as-template` | Save current budget as a template |
| POST | `/api/v1/budgets/from-template/:templateId` | Apply template to `?month=&year=` |
| DELETE | `/api/v1/budgets/templates/:id` | Delete a template |

### Budget Summary (computed, read-only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/budgets/:id/summary` | Planned vs. actual per line, variance, % used |
| GET | `/api/v1/budgets/:id/summary/line/:lineId` | Drill-down: matched entries for one line |

## Setup

### Server

```bash
cd server && npm install
cp .env.example .env
npm run dev
```

Key `.env` variables:

```env
# Database — choose one
DB_PROVIDER=mongodb          # or: mysql
MONGO_URI=mongodb://localhost:27017/abmiti

# MySQL (only needed when DB_PROVIDER=mysql)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=secret
MYSQL_DATABASE=abmiti

# Auth
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

For MySQL, run the schema migration first:

```bash
mysql -u root -p abmiti < server/src/infrastructure/database/mysql/schema.sql
```

### Client

```bash
cd client && npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm run dev
```

### Flutter Mobile App

```bash
cd flutter_app
flutter pub get
flutter run                    # development
flutter build apk --release    # Android APK
flutter build ios              # iOS (requires macOS + Xcode)
```

The app loads `https://voltwavebd.com/abmiti/login` as the initial screen. No additional environment configuration is required for the WebView shell.

## Domain Models

| Model | Key Fields |
|-------|-----------|
| `User` | name, email, password (bcrypt), budget |
| `Entry` | user, type (income/expense/savings/investment/payable/receivable), amount, note, category, source, account, date, parsedFromSms |
| `Category` | user, name, icon, color, type (income/expense), isDefault |
| `Account` | user, name, type (bank/mobile), accountNumber, bankName, provider, balance, isActive |
| `Budget` | user, month, year, totalIncome, lines[ ], isTemplate, templateName |
| `BudgetLine` | name, icon, color, allocationMethod (percentage/fixed), allocationValue, linkedCategoryIds, subItems[ ], order, isActive |

## Budget Feature

### Default Halal Template

Every new user is automatically seeded with the following budget template, fully editable:

| # | Line | Allocation | Icon |
|---|------|-----------|------|
| 1 | Living Cost | 50% | 🏠 |
| 2 | Investment | 25% | 📈 |
| 3 | Wife Expenses | 10% | 💝 |
| 4 | Fun / Entertainment | 5% | 🎉 |
| 5 | Emergency Fund | 5% | 🛡️ |
| 6 | Charity (Sadaqah) | 5% | 🤲 |

### Progress Bar Status Colors

| Status | Threshold | Color |
|--------|-----------|-------|
| On Track | ≤ 80% used | Sage green `#4A7C59` |
| Warning | 80–100% used | Mustard `#D4973E` |
| Over Budget | > 100% used | Terra red `#C2552A` |
| Unused | 0% used | Muted |

### Business Rules

- One active (non-template) budget per user per month/year.
- Allocation totals may exceed or fall under 100% — surfaced as an advisory, not blocked.
- A category can be linked to only one budget line per budget.
- Deleting a budget line does not delete entries — only removes the mapping.
- Sub-items are informational and do not affect entry matching; `linkedCategoryIds` drives all actual-vs-planned computation.
