# Abmiti Mobile App — UI/UX Upgrade Plan

## Codebase Audit Summary

### Existing Flutter Architecture
- **Entry**: `main.dart` — `MaterialApp` with light theme, `AuthRepository` as `ChangeNotifier`
- **Auth**: Login/register screen with validation
- **Home**: Single `home_screen.dart` (764 lines) with 3 tabs (Overview, Activity, Profile) via `IndexedStack`
- **Data**: `ApiClient` (Dio + token refresh), `AuthRepository` (ChangeNotifier)
- **Shared widgets**: `LoadingOverlay`, `NoInternetScreen`
- **Colors**: terra/terraDark/sage/mustard/ink/paper/paperMist (7 brand colors)
- **Dependencies**: `dio`, `flutter_secure_storage`, `webview_flutter`, `connectivity_plus`, `url_launcher`

### Backend API Endpoints Available
| Area | Endpoints |
|------|-----------|
| **Summary** | `GET /summary/monthly`, `/categories`, `/yearly`, `/yearly-summary`, `/accounts`, `/budget-warnings`, `/category-report`, `/transaction-statement` |
| **Categories** | `GET/POST/PATCH/DELETE /categories` (full CRUD) |
| **Budgets** | `GET / (by month)`, `POST /`, `PUT/:id`, `DELETE/:id`, `GET/:id/summary`, lines CRUD, templates, copy |
| **Entries** | `GET/POST/PATCH/DELETE /entries` with pagination |
| **Auth** | login, register, refresh, me, update profile |
| **Notifications** | list, read-all, read/:id, clear-all, clear/:id |
| **Subscriptions/Payments** | list, start payment |
| **Accounts** | full CRUD |

### What Needs Charting
- `fl_chart` (add dependency) — lightweight, performant, no native code

---

## Implementation Structure

### Phase 1 — Foundation Layer

#### 1.1 New Dependencies (`pubspec.yaml`)
```yaml
fl_chart: ^0.69.0       # Charts for analytics
```

#### 1.2 Theme System (`core/theme/`)
- `app_theme.dart` — Light + Dark ThemeData with glossy design tokens
- Update `app_colors.dart` — Add dark-mode palette variants, glossy gradient helpers

#### 1.3 Reusable Shared Widgets (`shared/widgets/`)
- `glossy_card.dart` — Frosted-glass card with subtle gradient, soft shadow
- `shimmer_loading.dart` — Skeleton loading placeholders
- `empty_state.dart` — Reusable empty-data widget
- `error_state.dart` — Reusable error + retry widget
- `stat_chip.dart` — Compact metric display
- `section_header.dart` — Section titles with optional trailing action
- `month_year_picker.dart` — Month/year selector for reports
- `progress_ring.dart` — Circular progress for budgets

#### 1.4 Data Layer (`shared/data/`)
- `finance_repository.dart` — Centralized API calls for categories, budgets, summaries, entries

### Phase 2 — Navigation Architecture

#### 2.1 App Shell (`features/shell/`)
- `app_shell.dart` — Scaffold with bottom nav + drawer, state preservation
- Bottom nav: **Overview**, **Activity**, **Budgets**, **Analytics**
- Drawer: Profile header, Categories, Reports, Settings, Sign Out

### Phase 3 — Feature Screens

#### 3.1 Overview (refactored from home_screen dashboard)
- Glossy summary card with gradient
- Budget progress ring
- Category spending chips
- Recent activity preview

#### 3.2 Activity (refactored from home_screen ledger)
- Infinite scroll entries list
- FAB for add entry

#### 3.3 Categories (`features/categories/`)
- `categories_screen.dart` — List with icons, colors, totals
- `category_form.dart` — Create/edit dialog
- Search/filter by type
- Swipe-to-delete

#### 3.4 Monthly Reports (`features/reports/`)
- `reports_screen.dart` — Month picker, income/expense summary cards
- Category-wise breakdown bars
- Previous month comparison
- Transaction statement view

#### 3.5 Analytics (`features/analytics/`)
- `analytics_screen.dart` — Interactive charts
- Income vs expense line chart (yearly trend)
- Category pie/donut chart
- Monthly comparison bar chart
- Empty state handling

#### 3.6 Budgets (`features/budgets/`)
- `budget_screen.dart` — Current budget overview with progress bars per line
- Budget summary from `GET /:id/summary`
- Line-level spending indicators (on_track/warning/over_budget)
- Edit total income
- Add/edit/remove lines

#### 3.7 Profile (refactored)
- Moved into drawer navigation
- Subscription and payment unchanged

### Phase 4 — Testing

- `test/finance_repository_test.dart`
- `test/navigation_test.dart`
- `test/budget_screen_test.dart`
- `test/categories_screen_test.dart`

### Phase 5 — Polish
- Run `dart format`, `flutter analyze`
- Verify builds

---

## File Map (New/Modified)

```
lib/
  main.dart                                 [MODIFY] — new theme, new shell
  core/
    constants/app_colors.dart               [MODIFY] — dark mode colors
    theme/app_theme.dart                    [NEW]    — glossy theme
  shared/
    data/
      api_client.dart                       [KEEP]
      auth_repository.dart                  [KEEP]  
      finance_repository.dart               [NEW]    — categories, budgets, summaries API
    widgets/
      glossy_card.dart                      [NEW]
      shimmer_loading.dart                  [NEW]
      empty_state.dart                      [NEW]
      error_state.dart                      [NEW]
      section_header.dart                   [NEW]
      month_year_picker.dart                [NEW]
      progress_ring.dart                    [NEW]
      stat_chip.dart                        [NEW]
      loading_overlay.dart                  [KEEP]
      no_internet_screen.dart               [KEEP]
  features/
    auth/auth_screen.dart                   [MODIFY] — glossy styling
    shell/app_shell.dart                    [NEW]    — bottom nav + drawer
    home/
      overview_tab.dart                     [NEW]    — refactored from dashboard
      activity_tab.dart                     [NEW]    — refactored from ledger
      entry_form.dart                       [NEW]    — extracted from home_screen
    categories/
      categories_screen.dart                [NEW]
      category_form.dart                    [NEW]
    reports/
      reports_screen.dart                   [NEW]
    analytics/
      analytics_screen.dart                 [NEW]
    budgets/
      budget_screen.dart                    [NEW]
    profile/
      profile_screen.dart                   [NEW]    — refactored from home_screen
test/
  (existing tests preserved + new tests)
```

> [!IMPORTANT]
> No new backend endpoints required. All features use existing APIs.
> Chart library `fl_chart` is the only new dependency.
