# Abmiti Design Review — Phase 0
_Evidence: budget.service.ts, budget.model.ts, budget.mysql.repo.ts, budget.mongo.repo.ts, entry.model.ts, entry.service.ts, account.mysql.repo.ts, summary.*.repo.ts, schema.sql, repositories.ts, budget.validators.ts_

---

## Real-use

**C1. budget_line_categories never populated on budget create** — CONFIRMED.
- `defaultBudgetLines` and `seedDefaultBudget` pass no `linkedCategoryIds`; `insertLines` only writes rows if array non-empty. All lines return `actualAmount=0` on first use.

**C5. Calendar-month periods misfit salary-cycle users** — CONFIRMED.
- Period hard-coded `(year, month-1, 1)...(year, month, 0)`. No `cycleStartDay` in schema/model.

**C10. No recurring entries / committed-expense data** — CONFIRMED.
- `entry.model.ts` has no recurrence fields. Forecasting has no committed-expense anchor.

**C11. `users.budget` legacy/redundant with `budgets`** — CONFIRMED.
- `users.budget DECIMAL(15,2)` in schema; `updateBudget` called only in `auth.service.ts`. Superseded by `budgets` table.

---

## Logical

**C2. Category mappable to multiple lines (double counting)** — REFUTED (partially).
- `assertUniqueLinkedCategories` in `budget.service.ts:36-44` throws 400 within a write. BUT `budget_line_categories` has no `UNIQUE(budget_id, category_id)` DB constraint; Mongo has no DB-level guard. Concurrent or direct-DB writes can bypass. FIXED-IN-PHASE-2.

**C3. `total_income` manual; no planned-vs-actual income variance** — CONFIRMED.
- `summary()` computes `totalVariance = totalPlanned - totalActual` (spend only); never compares income entries vs `totalIncome`.

**C6. savings/investment outflows excluded from line spend** — CONFIRMED.
- `findExpenseEntriesByCategories` hard-codes `type = 'expense'` in both MySQL (line 244) and Mongo (line 107). Unbudgeted bucket absent. FIXED-IN-PHASE-2.

**C7. payable/receivable: no counterparty/due_date/settlement/balance model** — CONFIRMED.
- No `payables` table; types are plain entries only. Double-counting risk real. FIXED-IN-PHASE-1.

---

## Mathematical

**C4. Percentage sum not validated; rounding can make sum(lines) != total** — CONFIRMED.
- Validators check per-line `allocationValue >= 0` only; no cross-line sum guard.
- `resolvePlannedAmount` rounds each line independently with `toFixed(2)`; on non-round incomes sum of lines can differ from income by n×0.01. No largest-remainder. FIXED-IN-PHASE-2.

**C14. Float arithmetic on amounts in JS** — CONFIRMED.
- `computeLineSummary` accumulates with raw `reduce((sum, e) => sum + e.amount, 0)` — IEEE-754 addition on JS Number. Storage is DECIMAL/Mongo Number; precision loss at JS layer only. FIXED-IN-PHASE-2 (`budget-math.ts` uses integer paisa).

---

## Data-model

**C8. "Savings" conflates stock and flow** — CONFIRMED.
- `type='savings'` entries are flows; `accounts.balance` is stock. `getAccountSummaries` aggregates savings-type entries by account, not balance; no reconciliation.

**C9. Cash not an account; balance denormalized; no transfer; source duplicates account.type** — CONFIRMED.
- No Cash account row; cash uses `source='cash'` on entries. `accounts.balance` updated by delta SQL but not linked to entry inserts — manual entries bypass silently. `entries.source` overlaps `accounts.type/provider`. `ON DELETE SET NULL` on `fk_entries_account` silently orphans entries.

---

## Dual-DB parity

**C12. Mongo vs MySQL parity gaps** — CONFIRMED.
- No DB-level FK/unique enforcement in Mongo beyond service guards (see C2).
- No MySQL transactions in budget or entry repos; multi-step ops (`insertLines` loop, `updateLine` cat/subitem deletes) are non-atomic.
- `findExpenseEntriesByCategories` loads full entry rows into Node rather than aggregating in DB.
- Running-balance in transaction statement computed in Node after full-row load (both repos).

**C13. Zakat lumped in Charity line; riba on payables not modelled** — CONFIRMED.
- Default line "Charity (Sadaqah)" note: "Optional; zakat, donations". Zakat is wealth-based (nisab/hawl) — percentage-of-income budgeting is incorrect. No nisab checker. Riba/interest on payables absent (no payable model — see C7).

---

## Key assumptions for subsequent phases
- **Next MySQL migration is 015** — `014_fix_emoji_charset.sql` already exists; the prompt's "013 is last" is stale.
- Receivable settlement model deferred to follow-up (Phase 1 spec).
- Salary-cycle-start-day out of scope for Phase 2 (noted in C5, will list in phase 2 report).
