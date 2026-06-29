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

# Task 3: Flutter WebView Mobile Application — Abmiti

## Context

Abmiti is a personal finance tracker with a fully responsive React + Vite web frontend (Task 2 completed) deployed at `https://voltwavebd.com/abmiti/`. The mobile app wraps this web app in a native Flutter shell. The user must never feel they are using a webview — the experience must be indistinguishable from a native app.

> **Scope change from original Task 3:** The original plan specified a full native Flutter app (Riverpod, Dio, GoRouter, native screens). This task replaces that with a **WebView wrapper** approach, leveraging the already-complete, mobile-responsive web frontend. This eliminates duplicated business logic while still delivering native-feeling UX enhancements.

---

## Objective

Build a Flutter Android/iOS application that:

1. Loads `https://voltwavebd.com/abmiti/login` as the initial screen inside a full-screen WebView.
2. Adds native-shell behaviors (back navigation, exit confirmation, status bar, splash screen, connectivity handling) so the user cannot distinguish it from a native app.
3. Passes app store review criteria and feels polished.

---

## Brand Colors

```dart
// lib/core/constants/app_colors.dart
class AppColors {
  static const terra      = Color(0xFFC2552A);
  static const terraDark  = Color(0xFF9A3D1A);
  static const sage       = Color(0xFF4A7C59);
  static const mustard    = Color(0xFFD4973E);
  static const ink        = Color(0xFF1A1208);
  static const paper      = Color(0xFFFDF6EC);
  static const paperMist  = Color(0xFFF0E8D8);
}
```

---

## Project Structure

```
flutter_app/
├── android/
│   └── app/
│       ├── src/main/AndroidManifest.xml   # Internet permission, fullscreen intent
│       └── build.gradle                   # minSdk 21, targetSdk 34
├── ios/
│   └── Runner/
│       └── Info.plist                     # NSAppTransportSecurity if needed
├── assets/
│   ├── splash/                            # Splash screen assets
│   └── icons/                            # App icon (terra brand color)
├── lib/
│   ├── core/
│   │   └── constants/
│   │       └── app_colors.dart
│   ├── features/
│   │   └── webview/
│   │       ├── webview_screen.dart        # Main WebView screen
│   │       └── webview_controller.dart    # WebView state & logic
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── no_internet_screen.dart
│   │   │   └── loading_overlay.dart
│   │   └── services/
│   │       └── connectivity_service.dart
│   └── main.dart
├── pubspec.yaml
└── README.md
```

---

## Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.7.0          # Official Flutter WebView
  webview_flutter_android: ^3.16.0
  webview_flutter_wkwebview: ^3.13.0
  connectivity_plus: ^6.0.3        # Network state detection
  flutter_native_splash: ^2.4.1    # Native splash screen
  flutter_launcher_icons: ^0.14.1  # App icon generation
  url_launcher: ^6.3.0             # Open external links in browser

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  flutter_native_splash: ^2.4.1
  flutter_launcher_icons: ^0.14.1
```

---

## Implementation Specifications

### 1. `main.dart`

- Set `SystemChrome.setPreferredOrientations` to portrait only (unless the web app is designed for landscape).
- Set `SystemChrome.setSystemUIOverlayStyle` using brand colors:
  - `statusBarColor`: `AppColors.terra`
  - `statusBarIconBrightness`: `Brightness.light`
- `runApp` with `MaterialApp` using `AppColors.terra` as `primaryColor`, no visible debug banner.
- Initial route: `WebViewScreen`.

### 2. `WebViewScreen` — Core WebView

**Initial URL:** `https://voltwavebd.com/abmiti/login`

**WebViewController configuration:**
```dart
controller
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..setBackgroundColor(AppColors.paper)
  ..setNavigationDelegate(NavigationDelegate(
    onPageStarted: (_) => setState(() => _isLoading = true),
    onPageFinished: (_) => setState(() => _isLoading = false),
    onWebResourceError: _handleError,
    onNavigationRequest: _handleNavigationRequest,
  ))
  ..loadRequest(Uri.parse('https://voltwavebd.com/abmiti/login'));
```

**User-Agent:** Set a custom user agent that identifies the platform for the web app to optionally detect:
```dart
await controller.setUserAgent(
  'Mozilla/5.0 (Linux; Android 11) AbmitiApp/1.0',
);
```

**Loading overlay:** While `onPageStarted` is firing and before `onPageFinished`, show a full-screen overlay with the brand splash (terra background + app name in paper color). Do not show a browser-style progress bar — it breaks the native illusion.

**External link handling (`onNavigationRequest`):**
```dart
NavigationRequest onNavigationRequest(NavigationRequest request) {
  final uri = Uri.parse(request.url);
  final isInternal = uri.host.contains('voltwavebd.com');
  if (!isInternal) {
    launchUrl(uri, mode: LaunchMode.externalApplication);
    return NavigationDecision.prevent;
  }
  return NavigationDecision.navigate;
}
```

### 3. Back Button Behavior

Use `PopScope` (Flutter 3.14+) wrapping the `WebView` widget:

```dart
PopScope(
  canPop: false,
  onPopInvokedWithResult: (didPop, result) async {
    if (didPop) return;
    if (await controller.canGoBack()) {
      controller.goBack();         // One press → go back in web history
    } else {
      _handleExitAttempt();        // Already at root → double-tap-to-exit
    }
  },
  child: WebViewWidget(controller: controller),
)
```

**Double-back-to-exit logic:**

```dart
DateTime? _lastBackPressed;

void _handleExitAttempt() {
  final now = DateTime.now();
  if (_lastBackPressed == null ||
      now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
    _lastBackPressed = now;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('আবার চাপলে অ্যাপ বন্ধ হবে'),   // Bengali
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.terraDark,
      ),
    );
  } else {
    SystemNavigator.pop();   // Exit the app
  }
}
```

### 4. No Internet Screen

`connectivity_plus` listens for connectivity changes. On loss of connection, replace the WebView with a branded offline screen:

- Terra background, paper text.
- Abmiti logo/name.
- Message: "ইন্টারনেট সংযোগ নেই" (No internet connection).
- A **Retry** button that re-checks connectivity and reloads the last URL if restored.
- Do not navigate away — remember the last attempted URL and reload it on reconnect.

```dart
// connectivity_service.dart
class ConnectivityService {
  final _controller = StreamController<bool>.broadcast();
  Stream<bool> get onConnectivityChanged => _controller.stream;

  ConnectivityService() {
    Connectivity().onConnectivityChanged.listen((result) {
      _controller.add(result != ConnectivityResult.none);
    });
  }
}
```

### 5. Splash Screen

Use `flutter_native_splash` for a true native splash (not a Flutter widget):

```yaml
# pubspec.yaml additions for flutter_native_splash
flutter_native_splash:
  color: "#C2552A"                # AppColors.terra hex
  image: assets/splash/logo.png  # White/paper colored app logo
  android_12:
    color: "#C2552A"
    icon_background_color: "#C2552A"
    image: assets/splash/logo.png
  fullscreen: true
```

Run: `dart run flutter_native_splash:create`

### 6. App Icon

Use `flutter_launcher_icons`:

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icons/app_icon.png"
  adaptive_icon_background: "#C2552A"
  adaptive_icon_foreground: "assets/icons/app_icon_foreground.png"
```

Run: `dart run flutter_launcher_icons`

### 7. `AndroidManifest.xml` Requirements

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

<application
  android:usesCleartextTraffic="false"
  android:hardwareAccelerated="true"   <!-- Required for smooth WebView -->
  ...>

  <activity
    android:windowSoftInputMode="adjustResize"  <!-- Prevents keyboard covering inputs -->
    android:exported="true"
    ...>
```

### 8. `build.gradle` (app level)

```groovy
android {
  compileSdk 34
  defaultConfig {
    minSdk 21        // Android 5.0+
    targetSdk 34
    versionCode 1
    versionName "1.0.0"
  }
}
```

---

## JavaScript Bridge (Optional Enhancement)

Inject a JS channel so the web app can optionally call native features:

```dart
controller.addJavaScriptChannel(
  'AbmitiNative',
  onMessageReceived: (message) {
    switch (message.message) {
      case 'SHARE':
        // Native share sheet
        break;
      case 'HAPTIC':
        HapticFeedback.lightImpact();
        break;
    }
  },
);
```

The web app can then call `window.AbmitiNative?.postMessage('HAPTIC')` on button taps to get native haptic feedback — deepening the native feel without requiring full native screens.

---

## What This Approach Does NOT Need

Because Task 2 (full mobile-responsive web UI) is complete, the following from the original Task 3 plan are **no longer needed**:

| Original Plan Item | Reason Dropped |
|--------------------|---------------|
| Riverpod providers | State lives in the web app |
| Dio + ApiService | HTTP is handled by the web app |
| `json_serializable` models | No native data layer needed |
| GoRouter + 9 native screens | Web router handles navigation |
| Native charts (fl_chart) | Recharts in web app handles this |
| `flutter_secure_storage` | Web app manages JWT in browser storage |

---

## Deliverables Checklist

- [ ] `flutter_app/` initialized (`flutter create --org com.voltwavebd abmiti`)
- [ ] `pubspec.yaml` with all dependencies above
- [ ] `lib/core/constants/app_colors.dart`
- [ ] `lib/main.dart` — system UI styling, orientation lock, MaterialApp
- [ ] `lib/features/webview/webview_screen.dart` — full WebView implementation
- [ ] `lib/features/webview/webview_controller.dart` — controller initialization
- [ ] `lib/shared/widgets/no_internet_screen.dart` — branded offline screen
- [ ] `lib/shared/widgets/loading_overlay.dart` — branded loading state
- [ ] `lib/shared/services/connectivity_service.dart`
- [ ] Back navigation: one press = web back, double press = exit with Bengali toast
- [ ] External URL handling via `url_launcher`
- [ ] Native splash screen configured and generated
- [ ] App icon configured and generated
- [ ] `AndroidManifest.xml` — internet permission, `adjustResize`, hardware acceleration
- [ ] `android/app/build.gradle` — minSdk 21, targetSdk 34
- [ ] `flutter analyze` passes with zero warnings
- [ ] Debug APK builds successfully (`flutter build apk --debug`)
- [ ] `flutter_app/README.md` — setup, build, and deployment instructions

---

## Quality Standards

- `flutter analyze` must pass with zero warnings or errors.
- The user must never see a URL bar, browser chrome, or any indication of a WebView.
- No visible loading progress bar — use a full branded overlay instead.
- All user-facing strings that are language-specific should default to Bengali where appropriate (toast messages, offline screen copy).
- The app must not crash on network loss — handle it gracefully with the offline screen.
- Keyboard must not cover form inputs (`adjustResize` in manifest).

---

## Notes & Suggestions for the Implementer

1. **Cookie/session persistence:** `webview_flutter` persists cookies by default on Android. No extra configuration needed for JWT sessions stored in `localStorage` or cookies on the web app side.

2. **Pull-to-refresh:** Consider wrapping the WebView in a `RefreshIndicator` and calling `controller.reload()` on pull. This feels very native and is a one-line addition.

3. **File upload support (Android):** If the web app ever needs file picker access (e.g., profile photo), `webview_flutter` on Android requires additional `onShowFileSelector` handling. Flag this for a future task if needed.

4. **iOS WKWebView note:** On iOS, `localStorage` data can be cleared by the OS under memory pressure. If the web app relies on localStorage for auth tokens, consider adding a JS bridge to mirror critical auth state to `flutter_secure_storage` as a future hardening measure.

5. **Version code automation:** Wire `versionCode` to CI build number from day one — avoids manual bumping for Play Store releases.

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
