/**
 * Pure math and calculation helpers for budget analysis and forecasting.
 * Uses integer paisa arithmetic (Math.round(x * 100)) to avoid float rounding inaccuracies.
 */

export type LineStatus = 'ok' | 'warn' | 'over';

export interface BudgetLineInputData {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  allocationMethod: 'percentage' | 'fixed';
  allocationValue: number;
  linkedCategoryIds: string[];
}

export interface EntryInputData {
  id: string;
  amount: number;
  type: string;
  categoryId: string;
  date: Date | string;
}

export interface ComputedLineSummary {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  allocationMethod: 'percentage' | 'fixed';
  allocationValue: number;
  linkedCategoryIds: string[];
  allocated: number;
  spent: number;
  remaining: number;
  pctUsed: number;
  status: LineStatus;
}

export interface BudgetAnalysisResult {
  plannedIncome: number;
  actualIncome: number;
  incomeVariance: number;
  totalAllocated: number;
  unallocated: number;
  totalSpent: number;
  unbudgetedSpent: number;
  netCashFlow: number;
  savingsRate: number | null;
  lines: ComputedLineSummary[];
  unbudgetedEntriesCount: number;
}

/**
 * Largest-remainder distribution for percentage allocations in paisa.
 */
export function calculateAllocations(
  lines: BudgetLineInputData[],
  incomeBasis: number,
): Map<string, number> {
  const basisPaisa = Math.round(incomeBasis * 100);
  const result = new Map<string, number>();

  // Fixed allocations
  lines
    .filter((l) => l.allocationMethod === 'fixed')
    .forEach((l) => {
      result.set(l.id, Math.round(l.allocationValue * 100));
    });

  // Percentage allocations using largest-remainder
  const pctLines = lines.filter((l) => l.allocationMethod === 'percentage');
  if (pctLines.length > 0) {
    const rawItems = pctLines.map((l) => {
      const raw = (basisPaisa * l.allocationValue) / 100;
      const floor = Math.floor(raw);
      const remainder = raw - floor;
      return { id: l.id, floor, remainder };
    });

    const totalPct = pctLines.reduce((s, l) => s + l.allocationValue, 0);
    const targetTotalPaisa = Math.round((basisPaisa * totalPct) / 100);
    const sumFloor = rawItems.reduce((s, it) => s + it.floor, 0);
    let diff = targetTotalPaisa - sumFloor;

    // Sort by largest remainder descending
    const sorted = [...rawItems].sort((a, b) => b.remainder - a.remainder);
    const addedIds = new Set<string>();

    for (let i = 0; i < diff && i < sorted.length; i++) {
      addedIds.add(sorted[i].id);
    }

    rawItems.forEach((it) => {
      const extra = addedIds.has(it.id) ? 1 : 0;
      result.set(it.id, it.floor + extra);
    });
  }

  // Convert paisa back to decimal
  const finalMap = new Map<string, number>();
  result.forEach((paisa, id) => {
    finalMap.set(id, Math.round(paisa) / 100);
  });
  return finalMap;
}

/**
 * Computes full budget-wise analysis:
 * Outflows: 'expense', 'savings', 'investment'.
 * Excludes legacy 'payable' and 'receivable'.
 */
export function computeBudgetAnalysis(
  lines: BudgetLineInputData[],
  entries: EntryInputData[],
  budgetTotalIncome: number,
  actualIncome: number,
): BudgetAnalysisResult {
  const incomeBasis = budgetTotalIncome > 0 ? budgetTotalIncome : actualIncome;
  const allocations = calculateAllocations(lines, incomeBasis);

  // Map categoryId -> lineId
  const categoryToLineId = new Map<string, string>();
  lines.forEach((line) => {
    line.linkedCategoryIds.forEach((catId) => {
      categoryToLineId.set(String(catId), line.id);
    });
  });

  // Accumulate spend in paisa
  const lineSpendPaisa = new Map<string, number>();
  lines.forEach((l) => lineSpendPaisa.set(l.id, 0));

  let unbudgetedSpentPaisa = 0;
  let unbudgetedEntriesCount = 0;

  entries.forEach((e) => {
    // Only count expense, savings, investment outflows
    if (e.type !== 'expense' && e.type !== 'savings' && e.type !== 'investment') {
      return;
    }
    const catId = String(e.categoryId);
    const lineId = categoryToLineId.get(catId);
    const amtPaisa = Math.round(e.amount * 100);

    if (lineId && lineSpendPaisa.has(lineId)) {
      lineSpendPaisa.set(lineId, (lineSpendPaisa.get(lineId) || 0) + amtPaisa);
    } else {
      unbudgetedSpentPaisa += amtPaisa;
      unbudgetedEntriesCount++;
    }
  });

  let totalAllocatedPaisa = 0;
  let totalLineSpentPaisa = 0;

  const computedLines: ComputedLineSummary[] = lines.map((line) => {
    const allocated = allocations.get(line.id) ?? 0;
    const allocatedPaisa = Math.round(allocated * 100);
    const spentPaisa = lineSpendPaisa.get(line.id) || 0;
    const spent = spentPaisa / 100;
    const remainingPaisa = allocatedPaisa - spentPaisa;
    const remaining = remainingPaisa / 100;

    totalAllocatedPaisa += allocatedPaisa;
    totalLineSpentPaisa += spentPaisa;

    const pctUsed = allocatedPaisa > 0 ? Math.round((spentPaisa / allocatedPaisa) * 100) : spentPaisa > 0 ? 100 : 0;
    let status: LineStatus = 'ok';
    if (pctUsed > 100) status = 'over';
    else if (pctUsed >= 80) status = 'warn';

    return {
      id: line.id,
      name: line.name,
      icon: line.icon,
      color: line.color,
      allocationMethod: line.allocationMethod,
      allocationValue: line.allocationValue,
      linkedCategoryIds: line.linkedCategoryIds,
      allocated,
      spent,
      remaining,
      pctUsed,
      status,
    };
  });

  const totalSpentPaisa = totalLineSpentPaisa + unbudgetedSpentPaisa;
  const basisPaisa = Math.round(incomeBasis * 100);
  const actualIncomePaisa = Math.round(actualIncome * 100);
  const plannedIncomePaisa = Math.round(budgetTotalIncome * 100);

  const totalAllocated = totalAllocatedPaisa / 100;
  const unallocated = (basisPaisa - totalAllocatedPaisa) / 100;
  const totalSpent = totalSpentPaisa / 100;
  const unbudgetedSpent = unbudgetedSpentPaisa / 100;
  const netCashFlow = (actualIncomePaisa - totalSpentPaisa) / 100;
  const savingsRate =
    actualIncomePaisa > 0
      ? Math.round(((actualIncomePaisa - totalSpentPaisa) / actualIncomePaisa) * 1000) / 10
      : null;

  return {
    plannedIncome: plannedIncomePaisa / 100,
    actualIncome: actualIncomePaisa / 100,
    incomeVariance: (plannedIncomePaisa - totalSpentPaisa) / 100,
    totalAllocated,
    unallocated,
    totalSpent,
    unbudgetedSpent,
    netCashFlow,
    savingsRate,
    lines: computedLines,
    unbudgetedEntriesCount,
  };
}

/**
 * Helper to compute the median of a number array.
 * Robust against outliers (spikes).
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

export type ForecastWarningCode =
  | 'LINE_OVER_ALLOCATION'
  | 'NET_NEGATIVE'
  | 'PAYABLE_DUE_EXCEEDS_BUFFER';

export interface ForecastWarning {
  code: ForecastWarningCode;
  lineId?: string;
  lineName?: string;
  amount?: number;
  message: string;
}

export interface MonthForecast {
  month: number;
  year: number;
  projectedIncome: number;
  projectedSpend: number;
  committedPayables: number;
  projectedNet: number;
  warnings: ForecastWarning[];
}

export interface ForecastResult {
  insufficientHistory: boolean;
  months: MonthForecast[];
}

export interface HistoricalMonthData {
  month: number;
  year: number;
  actualIncome: number;
  lineSpends: Map<string, number>; // lineId or lineName -> spend
  totalSpend: number;
}

export interface UpcomingMonthPlan {
  month: number;
  year: number;
  budgetTotalIncome?: number;
  lines: BudgetLineInputData[];
  committedPayables: number;
}

/**
 * Calculates a multi-month forward forecast based on last 2-3 completed months.
 */
export function calculateForecast(
  history: HistoricalMonthData[],
  upcoming: UpcomingMonthPlan[],
): ForecastResult {
  if (history.length < 2) {
    return {
      insufficientHistory: true,
      months: upcoming.map((u) => ({
        month: u.month,
        year: u.year,
        projectedIncome: u.budgetTotalIncome ?? 0,
        projectedSpend: 0,
        committedPayables: u.committedPayables,
        projectedNet: (u.budgetTotalIncome ?? 0) - u.committedPayables,
        warnings: [],
      })),
    };
  }

  // Median actual income over history
  const medianActualIncome = calculateMedian(history.map((h) => h.actualIncome));

  const forecastMonths: MonthForecast[] = upcoming.map((up) => {
    const projectedIncome =
      up.budgetTotalIncome && up.budgetTotalIncome > 0
        ? up.budgetTotalIncome
        : medianActualIncome;

    const allocations = calculateAllocations(up.lines, projectedIncome);

    let projectedSpendPaisa = 0;
    const warnings: ForecastWarning[] = [];

    // For each line, compute median historical spend
    up.lines.forEach((line) => {
      const historicalSpends = history.map(
        (h) => h.lineSpends.get(line.id) ?? h.lineSpends.get(line.name) ?? 0,
      );
      const lineProjectedSpend = calculateMedian(historicalSpends);
      const lineAllocated = allocations.get(line.id) ?? 0;

      projectedSpendPaisa += Math.round(lineProjectedSpend * 100);

      if (lineAllocated > 0 && lineProjectedSpend > lineAllocated) {
        const excess = Math.round((lineProjectedSpend - lineAllocated) * 100) / 100;
        warnings.push({
          code: 'LINE_OVER_ALLOCATION',
          lineId: line.id,
          lineName: line.name,
          amount: excess,
          message: `Projected spend for "${line.name}" (৳${lineProjectedSpend}) exceeds allocation (৳${lineAllocated}) by ৳${excess}`,
        });
      }
    });

    const projectedSpend = projectedSpendPaisa / 100;
    const committedPayables = up.committedPayables;
    const projectedNet = Math.round((projectedIncome - projectedSpend - committedPayables) * 100) / 100;

    if (projectedNet < 0) {
      warnings.push({
        code: 'NET_NEGATIVE',
        amount: Math.abs(projectedNet),
        message: `Projected net cash flow is negative (৳${projectedNet})`,
      });
    }

    const netBeforeCommitted = projectedIncome - projectedSpend;
    if (netBeforeCommitted > 0 && committedPayables > netBeforeCommitted) {
      warnings.push({
        code: 'PAYABLE_DUE_EXCEEDS_BUFFER',
        amount: committedPayables,
        message: `Committed payables (৳${committedPayables}) exceed net income buffer (৳${netBeforeCommitted})`,
      });
    }

    return {
      month: up.month,
      year: up.year,
      projectedIncome,
      projectedSpend,
      committedPayables,
      projectedNet,
      warnings,
    };
  });

  return {
    insufficientHistory: false,
    months: forecastMonths,
  };
}
