## Task 3: Build React Native (Expo) Mobile Application

### Objective

Build a React Native (Expo + TypeScript) mobile app that mirrors the web app's functionality using the same backend REST API. The app will be a native client of the web app, not a WebView wrapper. Target: Android (primary), iOS (codebase ready).

### Current Backend API Base URL

```
http://<host>:5000/api/v1
```

All endpoints require `Authorization: Bearer <accessToken>` except `/auth/login` and `/auth/register`.

### Architecture

```
rn_app/                                # Root: npx create-expo-app abmiti-mobile -t expo-template-blank-typescript
├── src/
│   ├── core/
│   │   ├── constants/
│   │   │   ├── apiConstants.ts        # Base URL, endpoint paths
│   │   │   └── appColors.ts           # Brand colors matching web (terra #c2552a, sage #4a7c59, etc.)
│   │   ├── errors/
│   │   │   └── AppException.ts        # Typed exceptions (UnauthorizedError, NetworkError, etc.)
│   │   └── utils/
│   │       ├── currencyFormatter.ts   # BDT formatting
│   │       └── dateUtils.ts
│   ├── services/
│   │   ├── apiService.ts              # Axios client with token interceptor
│   │   ├── authService.ts
│   │   ├── entryService.ts
│   │   ├── categoryService.ts
│   │   ├── accountService.ts
│   │   └── summaryService.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── entry.ts
│   │   ├── category.ts
│   │   ├── account.ts
│   │   └── monthlySummary.ts
│   ├── repositories/
│   │   ├── authRepository.ts
│   │   ├── entryRepository.ts
│   │   ├── categoryRepository.ts
│   │   └── summaryRepository.ts
│   ├── store/                         # Zustand stores
│   │   ├── authStore.ts
│   │   ├── entryStore.ts
│   │   ├── categoryStore.ts
│   │   └── summaryStore.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── components/
│   │   │       ├── SummaryCard.tsx
│   │   │       ├── RecentEntriesList.tsx
│   │   │       └── CategoryPieChart.tsx
│   │   ├── entries/
│   │   │   ├── EntriesScreen.tsx
│   │   │   ├── AddEntryScreen.tsx
│   │   │   └── components/
│   │   │       ├── EntryListItem.tsx
│   │   │       └── EntryTypeFilter.tsx
│   │   ├── categories/
│   │   │   ├── CategoriesScreen.tsx
│   │   │   └── AddCategorySheet.tsx
│   │   ├── accounts/
│   │   │   ├── AccountsScreen.tsx
│   │   │   └── AddAccountSheet.tsx
│   │   ├── analytics/
│   │   │   └── AnalyticsScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # Auth stack vs App stack switch
│   │   ├── AuthStack.tsx
│   │   ├── AppTabs.tsx                # Bottom tab navigator
│   │   └── types.ts                   # Navigation param lists
│   ├── components/
│   │   ├── AppButton.tsx
│   │   ├── AppTextField.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── ErrorView.tsx
│   └── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

### Dependencies (`package.json`)

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "typescript": "^5.4.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "expo-secure-store": "~13.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "react-native-gifted-charts": "^1.4.0",
    "react-native-svg": "^15.2.0",
    "intl": "^1.2.5",
    "@react-native-async-storage/async-storage": "^1.23.0",
    "expo-image": "~1.12.0",
    "expo-font": "~12.0.0",
    "@expo-google-fonts/dm-sans": "^0.2.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "~3.31.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "@babel/core": "^7.20.0",
    "eslint": "^8.57.0",
    "eslint-config-expo": "^7.1.0"
  }
}
```

**Mapping notes (Flutter → RN):**

| Flutter | React Native (Expo) | Purpose |
|---|---|---|
| `flutter_riverpod` | `zustand` | State management |
| `dio` | `axios` | HTTP client |
| `flutter_secure_storage` | `expo-secure-store` | JWT token persistence |
| `go_router` | `@react-navigation/native` (+ stack + bottom-tabs) | Navigation |
| `fl_chart` | `react-native-gifted-charts` | Charts |
| `intl` | `date-fns` + `Intl` (built-in) | Date/currency formatting |
| `shared_preferences` | `@react-native-async-storage/async-storage` | Light local caching |
| `cached_network_image` | `expo-image` (built-in caching) | Image loading/caching |
| `google_fonts` | `@expo-google-fonts/dm-sans` | DM Sans (matches web) |
| `json_serializable` / `build_runner` | Plain TypeScript interfaces + manual/zod mappers | Type-safe models (no codegen step needed) |

### Implementation Plan

#### Step 1 — Project Setup

```bash
npx create-expo-app abmiti-mobile -t expo-template-blank-typescript
cd abmiti-mobile
npx expo install expo-secure-store react-native-svg react-native-screens react-native-safe-area-context
npm install zustand axios @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-gifted-charts date-fns @react-native-async-storage/async-storage
npx expo install expo-image expo-font @expo-google-fonts/dm-sans
```

#### Step 2 — API Service with Axios + Token Interceptor

```
// src/services/apiService.ts
- Create a singleton Axios instance with baseURL = ApiConstants.baseUrl,
  timeout config (connect/receive equivalent via axios `timeout`),
  default header 'Content-Type: application/json'
- Add a request interceptor that reads the access token from
  expo-secure-store and attaches it as `Authorization: Bearer <token>`
- Add a response interceptor that, on HTTP 401, calls POST /auth/refresh,
  stores the new token pair, and retries the original failed request once
  (use a request queue/mutex to avoid parallel refresh storms)
- Expose typed wrapper methods (get/post/put/delete) used by all *Service files
```

#### Step 3 — Models (Plain TypeScript Interfaces)

```typescript
// src/models/entry.ts

/**
 * Represents a single financial entry (income, expense, savings, etc.)
 * as returned by the backend API.
 */
export interface Entry {
  id: string;              // mapped from '_id'
  type: 'income' | 'expense' | 'savings' | 'investment' | 'payable' | 'receivable';
  amount: number;
  note: string;
  category: Category;
  source: 'bank' | 'bkash' | 'nagad' | 'cash' | 'card' | 'other';
  date: string;             // ISO 8601; convert via dateUtils when rendering
  parsedFromSms: boolean;
}

/**
 * Maps a raw API entry payload (snake/underscore Mongo fields) into
 * the strongly-typed Entry model used throughout the app.
 */
export function mapEntryFromApi(json: Record<string, any>): Entry {
  // field-mapping logic (e.g. _id → id)
}
```

- No codegen/build_runner step is required — keep mapper functions colocated with each model file (`mapXFromApi`), and unit-test them where field-name drift from the API is likely (e.g. `_id`, nested `category` objects).
- Optional: introduce `zod` schemas per model for runtime validation if API payload trust is a concern; not required for MVP.

#### Step 4 — Authentication Flow

- `LoginScreen`: email + password form → `POST /auth/login` → store tokens via `expo-secure-store`
- `RegisterScreen`: name + email + password form → `POST /auth/register`
- `authStore` (Zustand): holds `user: User | null`, `status: 'idle' | 'authenticated' | 'unauthenticated'`, exposes `login()`, `logout()`, `register()`, `bootstrapFromStorage()`
- `RootNavigator`: reads `authStore.status` — renders `AuthStack` if unauthenticated, `AppTabs` if authenticated; show a splash/loading screen while `bootstrapFromStorage()` resolves on cold start

#### Step 5 — Dashboard Screen

Mirror the web dashboard layout:
- Month navigator (prev/next arrows + label)
- `SummaryCard` components: Income, Expense, Investment, Net Savings
- Progress bars for budget vs expense (use `View` width interpolation or a small library like `react-native-progress`)
- `RecentEntriesList` (last 8 entries, `FlatList`)
- `CategoryPieChart` using `react-native-gifted-charts` `PieChart`

#### Step 6 — Entries Screen

- Filter chips (All / Income / Expense / Investment / Savings / Payable / Receivable)
- Paginated `FlatList` (`onEndReached` for infinite scroll) of `EntryListItem`
- FAB (custom `Pressable` + absolute positioning, or `react-native-paper`'s FAB.Group) with speed-dial-style expansion for 6 entry types
- Pull-to-refresh via `FlatList`'s `refreshControl` prop
- Edit entry via bottom sheet (`@gorhom/bottom-sheet` recommended) on swipe-to-reveal or long-press
- Delete with undo via a custom Snackbar/Toast component (or `react-native-toast-message`)

#### Step 7 — Add Entry Screen / Bottom Sheet

Fields matching the web `ExpenseForm`:
- Type selector (segmented control — `@react-native-segmented-control/segmented-control` or custom)
- Amount input (numeric `TextInput` with `keyboardType="decimal-pad"`)
- Category picker (searchable dropdown sourced from `GET /api/v1/categories`)
- Source picker (bank, bkash, nagad, cash, card, other)
- Date picker (`@react-native-community/datetimepicker`)
- Note `TextInput` (multiline)
- Account picker (for savings entries)
- "Parse SMS" option (paste SMS text → send to backend parser endpoint, or run a local regex-based parser as fallback)

#### Step 8 — Analytics Screen

Using `react-native-gifted-charts`:
- `LineChart` — 12-month income vs expense trend (from `/summary/trend`)
- `PieChart` — category breakdown (from `/summary/categories`)
- Year selector (segmented control or dropdown)

#### Step 9 — Local Caching Strategy

- Cache last-fetched monthly summary and entry list in `@react-native-async-storage/async-storage` (serialize as JSON; mirror the `shared_preferences` key/value pattern)
- Show stale data with a refresh banner when network is unavailable (use `@react-native-community/netinfo` to detect connectivity)
- TTL: 5 minutes for summaries, 2 minutes for entry lists (store a `cachedAt` timestamp alongside payload and check on read)

### Notes / Open Decisions for the Agentic Build

- **State management**: Zustand chosen over Redux Toolkit for lower boilerplate; if the team anticipates needing time-travel debugging, middleware ecosystem, or stricter action/reducer conventions at scale, RTK is the fallback — flag this as a checkpoint after the auth + dashboard slice is built.
- **Bottom sheets**: not listed in the dependency table above but required by Steps 6–7; `@gorhom/bottom-sheet` should be added explicitly during Step 1 if not already installed.
- **Navigation typing**: define a single `RootStackParamList` / `AppTabParamList` in `navigation/types.ts` early, since React Navigation's TypeScript ergonomics depend on this being correct from the start — retrofitting it later is more costly than in Flutter's `go_router`.
- **SMS parsing on Android**: Expo's managed workflow restricts direct SMS inbox access; if "Parse SMS" requires reading device SMS (not just pasted text), this may require an Expo config plugin or ejecting to a bare workflow — confirm scope before implementation.
