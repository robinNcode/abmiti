# AI Agent Prompt — Budget Feature for Abmiti (আয় ব্যয় মিতি)

---

## 🎯 Mission

You are a senior full-stack engineer. Your task is to **design and implement a fully functional, user-customizable Budget Management feature** for the Abmiti personal finance tracker. This feature must integrate seamlessly into the existing codebase without breaking any existing functionality.

---

## 📦 Project Context

Abmiti is a personal finance tracker (আয় = income, ব্যয় = expense, মিতি = measure/balance).

**Stack:**
- **Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose) / MySQL (via DI container)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand
- **Mobile:** Flutter (Riverpod + Dio)
- **Auth:** JWT (access + refresh token)
- **i18n:** react-i18next (English + Bengali)

**Existing domain models to be aware of:**

| Model | Key Fields |
|---|---|
| `User` | name, email, password, budget (single number — to be extended) |
| `Entry` | user, type, amount, note, category, source, account, sector, date |
| `Category` | user, name, icon, color, type (income/expense), isDefault |
| `Account` | user, name, type, balance |

**Existing summary endpoints:** `/api/v1/summary/monthly`, `/api/v1/summary/categories`, `/api/v1/summary/trend`, `/api/v1/summary/yearly`

---

## 🧠 Feature Requirements

### Core Concept

A **Budget** in Abmiti is a named spending plan that a user defines for a given month. It consists of one or more **Budget Lines** — each line represents a spending/allocation category with a target amount (fixed or percentage-based).

The system must:
1. Allow the user to set a **total monthly income** as the budget base
2. Let the user define **budget lines** (name, allocation type, value, linked category, icon, color)
3. Automatically **track actual spending** per line by matching entries
4. Provide **real-time variance** (planned vs actual)
5. Support **budget templates** (reusable across months)
6. Ship with **sensible halal-friendly defaults** that users can freely customize or delete

---

## 📐 Domain Design

### Budget Line Allocation Types

```typescript
type AllocationMethod = 'percentage' | 'fixed';
```

- `percentage`: e.g., 50% of total income
- `fixed`: e.g., BDT 12,500 flat

When `percentage` is used, the system resolves the actual BDT amount based on the user's declared income for that month.

---

### Default Budget Template (Halal Budget)

When a new user registers, seed the following template as their **default**. They may edit, add, or delete any line.

| # | Name | Allocation | Type | Icon | Notes |
|---|------|-----------|------|------|-------|
| 1 | Living Cost | 50% | percentage | 🏠 | Family expenses: rent, food, utilities, education |
| 2 | Investment | 25% | percentage | 📈 | Land, gold, business, skill development |
| 3 | Wife Expenses | 10% | percentage | 💝 | Spouse allowance & personal needs |
| 4 | Fun / Entertainment | 5% | percentage | 🎉 | Leisure, dining out, travel |
| 5 | Emergency Fund | 5% | percentage | 🛡️ | Savings buffer |
| 6 | Charity (Sadaqah) | 5% | percentage | 🤲 | Optional; zakat, donations |

> **Important:** These 6 lines are the **initial seed**, not a limit. Users can create any budget structure they need.

---

### Budget Sub-Items (Expense Breakdown)

Each Budget Line may optionally contain **sub-items** — specific expected expenses that roll up into the line total.

Example for "Living Cost" line:

| Sub-Item | Amount |
|---|---|
| Home Rent | BDT 12,500 |
| Electricity | BDT 1,000 |
| WiFi | BDT 500 |
| Gas Bill | BDT 2,000 |
| Sister's Education Fee | BDT 3,000 |
| Food | BDT 6,000 |
| **Total** | **BDT 25,000** |

Sub-items help the user **plan granularly** while the budget line tracks the aggregate.

---

## 🗄️ Data Models

### MongoDB Schema

```typescript
// IBudgetSubItem
interface IBudgetSubItem {
  name: string;
  expectedAmount: number;
  note?: string;
}

// IBudgetLine
interface IBudgetLine {
  _id: ObjectId;
  name: string;
  icon: string;                        // emoji or icon key
  color: string;                       // hex color
  allocationMethod: 'percentage' | 'fixed';
  allocationValue: number;             // percentage (0–100) or fixed BDT amount
  linkedCategoryIds: ObjectId[];       // which Entry categories map to this line
  subItems: IBudgetSubItem[];          // optional granular breakdown
  order: number;                       // display sort order
  isActive: boolean;
  note?: string;
}

// IBudget (monthly budget plan)
interface IBudget {
  _id: ObjectId;
  user: ObjectId;
  month: number;                       // 1–12
  year: number;
  totalIncome: number;                 // user-declared income for this month
  lines: IBudgetLine[];
  isTemplate: boolean;                 // if true, used to seed future months
  templateName?: string;              // e.g., "Halal 50/25/10/10 Budget"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### MySQL Schema (for DB_PROVIDER=mysql parity)

```sql
CREATE TABLE budgets (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month           TINYINT UNSIGNED NOT NULL,       -- 1-12
  year            SMALLINT UNSIGNED NOT NULL,
  total_income    DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_template     BOOLEAN DEFAULT FALSE,
  template_name   VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month_year (user_id, month, year, is_template)
);

CREATE TABLE budget_lines (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  budget_id           VARCHAR(36) NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name                VARCHAR(100) NOT NULL,
  icon                VARCHAR(10) DEFAULT '📦',
  color               VARCHAR(7) DEFAULT '#4A7C59',
  allocation_method   ENUM('percentage','fixed') NOT NULL,
  allocation_value    DECIMAL(10,4) NOT NULL,
  sort_order          SMALLINT DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,
  note                TEXT
);

CREATE TABLE budget_line_categories (
  budget_line_id  VARCHAR(36) NOT NULL REFERENCES budget_lines(id) ON DELETE CASCADE,
  category_id     VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (budget_line_id, category_id)
);

CREATE TABLE budget_sub_items (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  budget_line_id  VARCHAR(36) NOT NULL REFERENCES budget_lines(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  expected_amount DECIMAL(15,2) NOT NULL,
  note            TEXT
);
```

---

## 🔌 API Endpoints

### Budget Plans

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/budgets?month=&year=` | Get budget for a specific month/year |
| POST | `/api/v1/budgets` | Create a new monthly budget |
| PUT | `/api/v1/budgets/:id` | Update budget (income, notes) |
| DELETE | `/api/v1/budgets/:id` | Delete a monthly budget |
| POST | `/api/v1/budgets/:id/copy?toMonth=&toYear=` | Clone budget to another month |

### Budget Lines

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/budgets/:id/lines` | Add a new budget line |
| PUT | `/api/v1/budgets/:id/lines/:lineId` | Edit a budget line |
| DELETE | `/api/v1/budgets/:id/lines/:lineId` | Remove a budget line |
| PATCH | `/api/v1/budgets/:id/lines/reorder` | Reorder lines (accepts `{ order: string[] }` array of lineIds) |

### Budget Templates

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/budgets/templates` | List user's saved templates |
| POST | `/api/v1/budgets/:id/save-as-template` | Save current budget as a template |
| POST | `/api/v1/budgets/from-template/:templateId?month=&year=` | Apply template to a month |
| DELETE | `/api/v1/budgets/templates/:id` | Delete a template |

### Budget Summary (read-only, computed)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/budgets/:id/summary` | Planned vs actual per line, variance, % used |
| GET | `/api/v1/budgets/:id/summary/line/:lineId` | Drill-down: matched entries for a specific line |

---

## 🧮 Summary Computation Logic

For each budget line, compute the following at query time (do not store):

```typescript
interface IBudgetLineSummary {
  lineId: string;
  name: string;
  icon: string;
  color: string;
  plannedAmount: number;        // resolved from percentage or fixed
  actualAmount: number;         // sum of matched entries this month
  variance: number;             // plannedAmount - actualAmount (positive = under budget)
  usedPercent: number;          // (actualAmount / plannedAmount) * 100
  status: 'on_track' | 'warning' | 'over_budget' | 'unused';
  subItems: IBudgetSubItemSummary[];
}

// Status thresholds (configurable per line in future):
// on_track   → usedPercent <= 80
// warning    → 80 < usedPercent <= 100
// over_budget → usedPercent > 100
// unused     → actualAmount === 0
```

**Entry matching logic:**
- An entry is matched to a budget line if its `category._id` is in `line.linkedCategoryIds`
- Only entries with `type = 'expense'` are matched (unless the line is explicitly for savings/investment)
- Only entries within the budget's `month` and `year` are included

---

## 📁 File Structure

Add the following to the existing project tree:

```
server/src/
├── modules/
│   └── budget/
│       ├── budget.controller.ts
│       ├── budget.service.ts
│       ├── budget.repository.ts           # interface
│       ├── budget.routes.ts
│       ├── budget.validators.ts
│       └── budget.types.ts
│
├── infrastructure/
│   └── repositories/
│       ├── mongodb/
│       │   └── budget.mongo.repo.ts
│       └── mysql/
│           └── budget.mysql.repo.ts

client/src/
├── api/
│   └── budget.api.ts
├── pages/
│   └── BudgetPage.tsx
├── components/
│   └── budget/
│       ├── BudgetOverview.tsx             # monthly summary cards
│       ├── BudgetLineCard.tsx             # individual line with progress bar
│       ├── BudgetLineForm.tsx             # add/edit line modal
│       ├── BudgetSubItemList.tsx          # granular sub-items list
│       ├── BudgetTemplateSelector.tsx     # pick/apply a template
│       └── BudgetMonthNavigator.tsx       # reuse/extend monthStore
├── hooks/
│   └── useBudget.ts
└── store/
    └── budgetStore.ts                     # Zustand slice
```

---

## ✅ Implementation Checklist

### Backend

- [ ] `IBudgetRepository` interface in `shared/types/repositories.ts`
- [ ] `Budget` Mongoose model with embedded `lines[]` and `subItems[]`
- [ ] `MongoDBudgetRepository` implementing the interface
- [ ] `MySqlBudgetRepository` with raw `mysql2` queries
- [ ] `container.ts` updated to wire `budgetRepo` for both providers
- [ ] `BudgetService` — pure business logic: resolve amounts, compute summaries, clone budget
- [ ] `BudgetController` — thin HTTP layer, delegates to service
- [ ] Seed function: on first `GET /api/v1/budgets?month=&year=` with no existing budget, auto-create from the Halal default template
- [ ] All validators using `express-validator` or `zod` (match project's existing choice)
- [ ] Routes registered in `routes.ts`
- [ ] TypeScript strict mode — no `any`

### Frontend

- [ ] `budget.api.ts` — typed Axios calls for all endpoints
- [ ] `useBudget` hook — fetches budget for current month (from `monthStore`)
- [ ] `BudgetPage` — main layout with income display, line cards, add-line button
- [ ] `BudgetLineCard` — shows name, icon, planned, actual, progress bar (color-coded by status)
- [ ] `BudgetLineForm` — modal for add/edit: name, icon picker, color picker, allocation method toggle, value input, category multi-select, sub-items editor
- [ ] `BudgetOverview` — top summary: total planned, total spent, total remaining
- [ ] Budget tab added to sidebar navigation
- [ ] Dashboard enhanced: add a "Budget Health" widget showing top 3 lines by usage %
- [ ] i18n keys added for all new strings (English + Bengali)
- [ ] Fully responsive: 375px → 1440px

### Behavior Details

- If a user has no budget for the current month, show an **onboarding card** offering to create from the Halal default template or start blank.
- The "copy last month's budget" option should appear if a prior month's budget exists.
- When total line allocations exceed 100% (percentage mode), show a **validation warning** (do not block save, but warn clearly).
- Deleting a budget line does **not** delete entries — only removes the mapping.
- The `totalIncome` field on a budget is independent of actual entry data — it's the user's declared planned income.

---

## 🎨 UI/UX Guidelines

Follow Abmiti's existing brand palette:

| Token | Value | Usage |
|---|---|---|
| `terra` | `#C2552A` | Over-budget status, danger |
| `sage` | `#4A7C59` | On-track status, success |
| `mustard` | `#D4973E` | Warning status (80–100%) |
| `ink` | `#1A1208` | Text |
| `paper` | `#FDF6EC` | Background |

Progress bar behavior:
- `< 80%` used → sage green fill
- `80–100%` used → mustard yellow fill
- `> 100%` used → terra red fill, show overflow amount

---

## 🔒 Business Rules

1. A user can have **at most one active (non-template) budget per month/year**.
2. Template budgets are not counted toward this limit.
3. A budget with no lines is valid (user may build incrementally).
4. Sub-items are **informational only** — they do not affect entry matching.
5. `linkedCategoryIds` drives actual-vs-planned matching; a category can be linked to **only one** budget line per budget (enforce in validation).
6. Total allocation across all active lines may exceed or be under 100% — this is allowed but surfaced as an advisory.

---

## 🧪 Testing Requirements

- Unit tests for `BudgetService`:
  - `resolvePlannedAmount()` — percentage vs fixed
  - `computeLineSummary()` — status thresholds
  - `seedDefaultBudget()` — correct 6 lines created
- Integration test: `GET /api/v1/budgets/summary` returns correct variance against seeded entries
- Frontend: `useBudget` hook tested with MSW mock handlers

---

## 📤 Deliverables

| # | Item |
|---|---|
| 1 | All backend files under `server/src/modules/budget/` and `server/src/infrastructure/repositories/*/budget.*` |
| 2 | Updated `container.ts` with `budgetRepo` |
| 3 | Updated `shared/types/repositories.ts` with `IBudgetRepository` |
| 4 | MySQL migration SQL added to `schema.sql` |
| 5 | All frontend files under `client/src/` (api, components, hooks, store, pages) |
| 6 | Updated sidebar nav with Budget link |
| 7 | Updated `DashboardPage` with Budget Health widget |
| 8 | i18n JSON files updated (en + bn) |
| 9 | Unit + integration tests |
| 10 | This feature must not break any existing tests or endpoints |
