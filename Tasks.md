# Abmiti Enhancement Project

## Project Overview

Abmiti is a personal finance tracking platform built with:

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (access + refresh tokens via `jsonwebtoken`) |
| State | Zustand (`authStore`, `monthStore`) |
| API Client | Axios with auto token-refresh interceptor |
| i18n | react-i18next (English + Bengali) |

### Current Architecture

```
abmiti/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── api/                   # Axios client + per-resource API fns
│       │   ├── client.ts          # Axios instance + refresh interceptor
│       │   ├── auth.api.ts
│       │   ├── entries.api.ts
│       │   ├── accounts.api.ts
│       │   └── summary.api.ts
│       ├── components/
│       │   ├── layout/            # AppLayout (sidebar + mobile nav), AuthLayout
│       │   ├── entry/             # EntryRow, ExpenseForm, SmsEntryForm
│       │   ├── charts/            # CategoryBreakdown
│       │   └── ui/                # SummaryCard, Modal, PageHeader, Spinner, EmptyState
│       ├── pages/                 # DashboardPage, EntriesPage, CategoriesPage,
│       │   	                   # AnalyticsPage, InvestmentsPage, SettingsPage,
│       │                          # LoginPage, RegisterPage
│       ├── store/                 # authStore.ts, monthStore.ts
│       ├── hooks/                 # useMonthlySummary, useEntries, etc.
│       ├── types/
│       ├── utils/
│       └── i18n.ts
│
└── server/                        # Express + TypeScript backend
    └── src/
        ├── config/                # env.ts, database.ts (MongoDB), logger.ts
        ├── modules/
        │   ├── auth/              # controller, service, model (User), routes, validators
        │   ├── entry/             # controller, service, repository, model, routes, validators
        │   ├── category/          # controller, service, model, routes
        │   ├── account/           # controller, service, model, routes
        │   └── summary/           # controller, service (aggregations), routes
        ├── shared/
        │   ├── middleware/        # errorHandler, rateLimiter, notFoundHandler
        │   ├── types/index.ts     # All domain interfaces (IUser, IEntry, ICategory, IAccount, …)
        │   └── utils/             # pagination, errors
        ├── routes.ts              # Central route registry
        └── app.ts                 # Express bootstrap
```

### Domain Models (current)

| Model | Key Fields |
|-------|-----------|
| `User` | name, email, password (bcrypt), budget |
| `Entry` | user, type (income/expense/savings/investment/payable/receivable), amount, note, category, source (bank/bkash/nagad/cash/card/other), account, sector, date, parsedFromSms, rawSms |
| `Category` | user, name, icon, color, type (income/expense), isDefault |
| `Account` | user, name, type (bank/mobile), accountNumber, bankName, provider (bkash/nagad/rocket), balance, isActive |

### REST API Endpoints (current)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |
| PATCH | `/api/v1/auth/me` | Update profile (budget) |
| GET | `/api/v1/entries` | List entries (filterable: type, month, year, category, source, page, limit) |
| POST | `/api/v1/entries` | Create entry |
| GET | `/api/v1/entries/:id` | Get entry by ID |
| PUT | `/api/v1/entries/:id` | Update entry |
| DELETE | `/api/v1/entries/:id` | Delete entry |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/:id` | Update category |
| DELETE | `/api/v1/categories/:id` | Delete category |
| GET | `/api/v1/accounts` | List accounts |
| POST | `/api/v1/accounts` | Create account |
| PUT | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Delete account |
| GET | `/api/v1/summary/monthly?month=&year=` | Monthly income/expense/savings summary |
| GET | `/api/v1/summary/categories?month=&year=` | Expense breakdown by category |
| GET | `/api/v1/summary/trend?year=` | 12-month income/expense trend |
| GET | `/api/v1/summary/yearly?year=` | Yearly totals |
| GET | `/api/v1/summary/accounts` | Savings per account |

---

## Task 1: Implement MySQL Support Using Dependency Injection

### Objective

Refactor the backend to support both MongoDB and MySQL through a database-agnostic repository layer, selectable via environment variable. Business logic in services must remain untouched.

### Current State

- `src/config/database.ts` directly imports Mongoose and connects to MongoDB.
- `env.ts` only has `MONGO_URI`; no MySQL config exists.
- Repositories are tightly coupled to Mongoose models (e.g., `entry.repository.ts` imports `Entry` model directly).
- `shared/types/index.ts` already has repository interfaces (`IPaginatedResult`, `IEntryFilters`, `IPaginationOptions`) — **extend these into full repository contracts**.

### Implementation Plan

#### Step 1 — Define repository interfaces in `shared/types/`

Create contracts for every module. Example for entries:

```typescript
// src/shared/types/repositories.ts
export interface IEntryRepository {
  findMany(userId: string, filters: IEntryFilters, pagination: IPaginationOptions): Promise<IPaginatedResult<IEntry>>;
  findById(id: string, userId: string): Promise<IEntry | null>;
  create(data: Partial<IEntry>): Promise<IEntry>;
  update(id: string, userId: string, data: Partial<IEntry>): Promise<IEntry | null>;
  remove(id: string, userId: string): Promise<boolean>;
}

export interface IUserRepository { ... }
export interface ICategoryRepository { ... }
export interface IAccountRepository { ... }
```

#### Step 2 — Restructure into `infrastructure/` layer

```
server/src/
├── infrastructure/
│   ├── database/
│   │   ├── mongodb/
│   │   │   └── connection.ts          # Moved from config/database.ts
│   │   └── mysql/
│   │       └── connection.ts          # New: mysql2/promise pool
│   └── repositories/
│       ├── mongodb/
│       │   ├── entry.mongo.repo.ts    # Existing repository, now implements IEntryRepository
│       │   ├── user.mongo.repo.ts
│       │   ├── category.mongo.repo.ts
│       │   └── account.mongo.repo.ts
│       └── mysql/
│           ├── entry.mysql.repo.ts    # New: raw SQL using mysql2
│           ├── user.mysql.repo.ts
│           ├── category.mysql.repo.ts
│           └── account.mysql.repo.ts
├── container.ts                       # DI container — wires repos based on DB_PROVIDER env var
```

#### Step 3 — DI Container (`src/container.ts`)

```typescript
import { env } from './config/env';

export interface AppContainer {
  entryRepo: IEntryRepository;
  userRepo: IUserRepository;
  categoryRepo: ICategoryRepository;
  accountRepo: IAccountRepository;
}

export function buildContainer(): AppContainer {
  if (env.DB_PROVIDER === 'mysql') {
    return {
      entryRepo:    new MySqlEntryRepository(),
      userRepo:     new MySqlUserRepository(),
      categoryRepo: new MySqlCategoryRepository(),
      accountRepo:  new MySqlAccountRepository(),
    };
  }
  // default: mongodb
  return {
    entryRepo:    new MongoEntryRepository(),
    userRepo:     new MongoUserRepository(),
    categoryRepo: new MongooCategoryRepository(),
    accountRepo:  new MongoAccountRepository(),
  };
}

export const container = buildContainer();
```

#### Step 4 — Refactor services to use injected repos

```typescript
// Before (tightly coupled)
import { entryRepository } from './entry.repository';

// After (DI)
import { container } from '../../container';
const repo = container.entryRepo;
```

#### Step 5 — MySQL schema migrations

Create `server/src/infrastructure/database/mysql/schema.sql`:

```sql
CREATE TABLE users (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  name       VARCHAR(80)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  budget     DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  icon       VARCHAR(10) DEFAULT '📦',
  color      VARCHAR(20) DEFAULT '#c2552a',
  type       ENUM('income','expense') NOT NULL,
  is_default BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_category (user_id, name, type)
);

CREATE TABLE accounts (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id        VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  type           ENUM('bank','mobile') NOT NULL,
  account_number VARCHAR(50),
  bank_name      VARCHAR(100),
  provider       ENUM('bkash','nagad','rocket'),
  balance        DECIMAL(15,2) DEFAULT 0,
  is_active      BOOLEAN      DEFAULT TRUE,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE entries (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            ENUM('income','expense','savings','investment','payable','receivable') NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  note            VARCHAR(300) DEFAULT '',
  category_id     VARCHAR(36) NOT NULL REFERENCES categories(id),
  source          ENUM('bank','bkash','nagad','cash','card','other') DEFAULT 'cash',
  account_id      VARCHAR(36) REFERENCES accounts(id),
  sector          VARCHAR(120) DEFAULT '',
  date            DATE NOT NULL,
  parsed_from_sms BOOLEAN DEFAULT FALSE,
  raw_sms         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_date      (user_id, date DESC),
  INDEX idx_user_type_date (user_id, type, date DESC),
  INDEX idx_user_category  (user_id, category_id)
);
```

#### Step 6 — Environment configuration

Add to `server/.env` and `server/.env.example`:

```env
# Database Provider: 'mongodb' | 'mysql'
DB_PROVIDER=mongodb

# MongoDB (used when DB_PROVIDER=mongodb)
MONGO_URI=mongodb://localhost:27017/abmiti

# MySQL (used when DB_PROVIDER=mysql)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=secret
MYSQL_DATABASE=abmiti
```

Update `src/config/env.ts` to include MySQL config fields, all optional (not `required()`).

#### Step 7 — Update `app.ts` bootstrap

```typescript
// Dynamically connect to the right DB
if (env.DB_PROVIDER === 'mysql') {
  await connectMySQL();
} else {
  await connectMongoDB();
}
```

### Deliverables Checklist

- [ ] `src/config/env.ts` — MySQL env vars added
- [ ] `server/.env.example` — updated with all new vars
- [ ] `DATABASES.md` — guide for adding a third database provider

---

## Task 2: Complete Frontend Redesign for Mobile Responsiveness

### Objective

Make every page and component fully responsive across mobile (≥320px), tablet (≥768px), laptop (≥1024px), and desktop (≥1280px). The sidebar navigation already hides on mobile with a bottom tab bar — audit and fix all remaining desktop-only layout issues.

### Current State

| Component | Issue |
|-----------|-------|
| `DashboardPage` | `grid grid-cols-4` summary cards break below 768px; `grid-cols-5` recent/category grid not responsive |
| `DashboardPage` | `px-8` fixed padding too large on mobile |
| `EntriesPage` | Header action row with 6 buttons overflows on small screens |
| `EntriesPage` | Filter buttons row (`flex-wrap`) wraps awkwardly |
| `AppLayout` | Bottom nav shows all 6 items — too crowded on small phones |
| `CategoriesPage` | Category grid spacing needs audit |
| `AnalyticsPage` | Charts likely overflow on mobile |
| `InvestmentsPage` | Needs audit |
| Forms (`ExpenseForm`, `SmsEntryForm`) | Modal widths / paddings need mobile audit |

### Requirements by Screen Size

```
Mobile  (< 768px):  single-column layouts, px-4 padding, stacked action buttons
Tablet  (768-1023px): 2-column grids, px-6 padding
Desktop (≥ 1024px): current multi-column layouts
```

### Implementation Plan

#### 2.1 — Dashboard (`DashboardPage.tsx`)

```tsx
// Summary cards: 2-col on mobile, 4-col on desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

// Recent + Category: full width stack on mobile, 5-col on desktop
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
  <div className="lg:col-span-3 card p-4 md:p-5">   {/* Recent entries */}
  <div className="lg:col-span-2 card p-4 md:p-5">   {/* Category chart */}

// Fix padding
<div className="px-4 md:px-8 space-y-4 md:space-y-6 pb-10">
```

#### 2.2 — Entries Page (`EntriesPage.tsx`)

Replace the 6-button header with a split primary action + overflow dropdown menu on mobile:

```tsx
// Mobile: show "Add Entry +" button → opens a type-selection sheet
// Desktop: keep existing 6 buttons in header
```

Filter pills: replace `flex flex-wrap` with a horizontally scrollable bar on mobile:

```tsx
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap">
```

#### 2.3 — AppLayout Bottom Nav

Limit bottom nav to 5 most important items on mobile. Move Settings into a profile drawer:

```tsx
const MOBILE_NAV = NAV.slice(0, 5); // Dashboard, Entries, Investments, Analytics, Categories
```

#### 2.4 — Charts (`AnalyticsPage`, `CategoryBreakdown`)

Wrap all Recharts/chart containers with `w-full` and `aspect-[4/3]` instead of fixed heights. Use `ResponsiveContainer` with `width="100%"`.

#### 2.5 — Forms and Modals

- Modal `max-w` should be `w-full max-w-md mx-4` on mobile
- Form fields: use `w-full` on all inputs; stack label + input on single column

#### 2.6 — Tailwind Config Additions

Add responsive utilities to `tailwind.config.js`:

```js
screens: {
  'xs': '375px',  // Small phones
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
}
```

#### 2.7 — Touch Interactions

- Minimum touch target: 44×44px for all buttons (add `min-h-[44px] min-w-[44px]` where needed)
- Remove hover-only states that have no touch equivalent
- Add `active:scale-95` feedback on primary action buttons

### Deliverables Checklist

- [x] `DashboardPage.tsx` — responsive grid, padding, and stacked layouts
- [x] `EntriesPage.tsx` — mobile-friendly header actions, scrollable filter pills
- [x] `AppLayout.tsx` — bottom nav trimmed to 5 items; Settings accessible via profile
- [x] `AnalyticsPage.tsx` — all charts use `ResponsiveContainer`, responsive heights
- [x] `CategoriesPage.tsx` — audited and fixed
- [x] `InvestmentsPage.tsx` — audited and fixed
- [x] All modals — full-width on mobile with proper margin
- [x] `tailwind.config.js` — `xs` breakpoint added
- [x] All buttons meet 44px minimum touch target
- [x] Cross-browser test: Chrome, Safari, Firefox (mobile viewports)

---

## Task 3: Build Flutter Mobile (Web-view) Application

### Objective

Build a Flutter mobile app that mirrors the web app's functionality using the same backend REST API. The app will be a web-view of the web app. Target: Android (primary), iOS (codebase ready).

### Current Backend API Base URL

```
http://<host>:5000/api/v1
```

All endpoints require `Authorization: Bearer <accessToken>` except `/auth/login` and `/auth/register`.

### Architecture

```
flutter_app/                           # Root: flutter create abmiti_mobile
├── lib/
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart     # Base URL, endpoint paths
│   │   │   └── app_colors.dart        # Brand colors matching web (terra #c2552a, sage #4a7c59, etc.)
│   │   ├── errors/
│   │   │   └── app_exception.dart     # Typed exceptions (UnauthorizedException, NetworkException, etc.)
│   │   └── utils/
│   │       ├── currency_formatter.dart  # BDT formatting
│   │       └── date_utils.dart
│   ├── services/
│   │   ├── api_service.dart           # Dio client with token interceptor
│   │   ├── auth_service.dart
│   │   ├── entry_service.dart
│   │   ├── category_service.dart
│   │   ├── account_service.dart
│   │   └── summary_service.dart
│   ├── models/
│   │   ├── user.dart
│   │   ├── entry.dart
│   │   ├── category.dart
│   │   ├── account.dart
│   │   └── monthly_summary.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── entry_repository.dart
│   │   ├── category_repository.dart
│   │   └── summary_repository.dart
│   ├── providers/                     # Riverpod providers
│   │   ├── auth_provider.dart
│   │   ├── entry_provider.dart
│   │   ├── category_provider.dart
│   │   └── summary_provider.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── summary_card.dart
│   │   │       ├── recent_entries_list.dart
│   │   │       └── category_pie_chart.dart
│   │   ├── entries/
│   │   │   ├── entries_screen.dart
│   │   │   ├── add_entry_screen.dart
│   │   │   └── widgets/
│   │   │       ├── entry_list_item.dart
│   │   │       └── entry_type_filter.dart
│   │   ├── categories/
│   │   │   ├── categories_screen.dart
│   │   │   └── add_category_sheet.dart
│   │   ├── accounts/
│   │   │   ├── accounts_screen.dart
│   │   │   └── add_account_sheet.dart
│   │   ├── analytics/
│   │   │   └── analytics_screen.dart
│   │   └── profile/
│   │       └── profile_screen.dart
│   ├── widgets/
│   │   ├── app_button.dart
│   │   ├── app_text_field.dart
│   │   ├── loading_overlay.dart
│   │   └── error_widget.dart
│   └── main.dart
├── pubspec.yaml
└── README.md
```

### Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0         # State management
  riverpod_annotation: ^2.3.0
  dio: ^5.4.0                       # HTTP client
  flutter_secure_storage: ^9.0.0   # JWT token persistence
  go_router: ^13.0.0                # Navigation
  fl_chart: ^0.68.0                 # Charts (replaces Recharts)
  intl: ^0.19.0                     # Date/currency formatting
  shared_preferences: ^2.2.0       # Light local caching
  cached_network_image: ^3.3.0
  google_fonts: ^6.2.0              # DM Sans (matches web)

dev_dependencies:
  build_runner: ^2.4.0
  riverpod_generator: ^2.3.0
  json_serializable: ^6.7.0
  flutter_lints: ^3.0.0
```

### Implementation Plan

#### Step 1 — Project Setup

```bash
flutter create --org com.abmiti abmiti_mobile
cd abmiti_mobile
# Add dependencies to pubspec.yaml
flutter pub get
```

#### Step 2 — API Service with Dio + Token Interceptor

```dart
// lib/services/api_service.dart
class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(AuthInterceptor());
  }
}

// AuthInterceptor: reads token from FlutterSecureStorage,
// on 401 → calls /auth/refresh, retries original request
```

#### Step 3 — Models with json_serializable

```dart
// lib/models/entry.dart
@JsonSerializable()
class Entry {
  final String id;        // mapped from '_id'
  final String type;      // income | expense | savings | investment | payable | receivable
  final double amount;
  final String note;
  final Category category;
  final String source;    // bank | bkash | nagad | cash | card | other
  final DateTime date;
  final bool parsedFromSms;

  const Entry({...});
  factory Entry.fromJson(Map<String, dynamic> json) => _$EntryFromJson(json);
  Map<String, dynamic> toJson() => _$EntryToJson(this);
}
```

#### Step 4 — Authentication Flow

- `LoginScreen`: email + password form → POST `/auth/login` → store tokens in `FlutterSecureStorage`
- `RegisterScreen`: name + email + password form → POST `/auth/register`
- `AuthProvider` (Riverpod): holds `User?`, exposes `login()`, `logout()`, `register()`
- `GoRouter` redirect: if no token → `/login`; if token → `/dashboard`

#### Step 5 — Dashboard Screen

Mirror `DashboardPage.tsx` layout:
- Month navigator (prev/next arrows + label)
- `SummaryCard` widgets: Income, Expense, Investment, Net Savings
- Progress bars for budget vs expense
- `RecentEntriesList` (last 8 entries)
- `CategoryPieChart` using `fl_chart` PieChart

#### Step 6 — Entries Screen

- Filter chips (All / Income / Expense / Investment / Savings / Payable / Receivable)
- Paginated `ListView.builder` of `EntryListItem`
- FAB (FloatingActionButton) with speed dial for 6 entry types
- Pull-to-refresh with `RefreshIndicator`
- Edit entry via bottom sheet (swipe-to-reveal or long-press)
- Delete with undo Snackbar

#### Step 7 — Add Entry Screen / Bottom Sheet

Fields matching `ExpenseForm`:
- Type selector (segmented control)
- Amount (numpad-style or text field)
- Category picker (searchable dropdown from `/api/v1/categories`)
- Source picker (bank, bkash, nagad, cash, card, other)
- Date picker
- Note text field
- Account picker (for savings entries)
- "Parse SMS" option (paste SMS → send to backend or local parser)

#### Step 8 — Analytics Screen

Using `fl_chart`:
- `LineChart` — 12-month income vs expense trend (from `/summary/trend`)
- `PieChart` — category breakdown (from `/summary/categories`)
- Year selector

#### Step 9 — Local Caching Strategy

- Cache last-fetched monthly summary and entry list in `shared_preferences`
- Show stale data with a refresh banner when network unavailable
- TTL: 5 minutes for summaries, 2 minutes for entry lists

### Brand Colors (matching web)

```dart
// lib/core/constants/app_colors.dart
class AppColors {
  static const terra   = Color(0xFFC2552A);
  static const terraDark  = Color(0xFF9A3D1A);
  static const sage    = Color(0xFF4A7C59);
  static const mustard = Color(0xFFD4973E);
  static const ink     = Color(0xFF1A1208);
  static const paper   = Color(0xFFFDF6EC);
  static const paperMist  = Color(0xFFF0E8D8);
  static const bkash   = Color(0xFFE2136E);
  static const nagad   = Color(0xFFF06922);
}
```

### Navigation Structure (GoRouter)

```dart
/login          → LoginScreen
/register       → RegisterScreen
/               → DashboardScreen
/entries        → EntriesScreen
/entries/add    → AddEntryScreen
/analytics      → AnalyticsScreen
/categories     → CategoriesScreen
/accounts       → AccountsScreen
/profile        → ProfileScreen
```

### Deliverables Checklist

- [ ] `flutter_app/` initialized with all dependencies
- [ ] `ApiService` with Dio + Auth interceptor (token attach + refresh on 401)
- [ ] All models with `json_serializable` (User, Entry, Category, Account, MonthlySummary)
- [ ] All repositories consuming API services
- [ ] Riverpod providers for auth, entries, categories, summary
- [ ] `LoginScreen` and `RegisterScreen`
- [ ] `DashboardScreen` with summary cards, progress bars, recent list, category chart
- [ ] `EntriesScreen` with filters, pagination, pull-to-refresh
- [ ] `AddEntryScreen` / bottom sheet with all fields
- [ ] `AnalyticsScreen` with line chart + pie chart
- [ ] `CategoriesScreen` (CRUD)
- [ ] `AccountsScreen` (CRUD)
- [ ] `ProfileScreen` (update budget, logout)
- [ ] `GoRouter` setup with auth redirect guard
- [ ] Local caching with stale-data UX
- [ ] Android `build.gradle` configured, debug APK builds successfully
- [ ] `flutter_app/README.md` — setup, env config, build instructions

---

## Expected Outcome

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Backend supports MongoDB **and** MySQL via DI container | ✅ Completed |
| 2 | `DB_PROVIDER` env var switches between databases seamlessly | ✅ Completed |
| 3 | React web app is fully responsive on all screen sizes | ✅ Completed |
| 4 | Flutter mobile app with full feature parity | ⬜ Pending |
| 5 | All three share the same REST API contract | ⬜ Pending |

### Quality Standards

- **Backend**: All new code in TypeScript with strict types; no `any` in repository layer
- **Frontend**: All responsive changes tested at 375px, 768px, 1024px, 1440px viewports
- **Flutter**: `flutter analyze` passes with zero warnings; `flutter test` covers service + repository layers
- **Backward Compatibility**: MongoDB path must remain functionally identical to today — no regressions
