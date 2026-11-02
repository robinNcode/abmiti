import {
  calculateAllocations,
  computeBudgetAnalysis,
  calculateMedian,
  calculateForecast,
  BudgetLineInputData,
  EntryInputData,
  HistoricalMonthData,
  UpcomingMonthPlan,
} from './budget-math';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — ${detail}`);
    failed++;
  }
}

console.log('\n[1] Rounding sums exactly (largest-remainder in paisa)');
{
  const lines: BudgetLineInputData[] = [
    { id: '1', name: 'A', allocationMethod: 'percentage', allocationValue: 33.33, linkedCategoryIds: [] },
    { id: '2', name: 'B', allocationMethod: 'percentage', allocationValue: 33.33, linkedCategoryIds: [] },
    { id: '3', name: 'C', allocationMethod: 'percentage', allocationValue: 33.34, linkedCategoryIds: [] },
  ];
  const totalIncome = 100000;
  const allocations = calculateAllocations(lines, totalIncome);
  const sum = Array.from(allocations.values()).reduce((a, b) => a + b, 0);
  assert('Sum of 33.33 + 33.33 + 33.34% equals exactly total income', sum === 100000, `Got: ${sum}`);

  const oddIncome = 83333.33;
  const oddAllocations = calculateAllocations(lines, oddIncome);
  const oddSum = Array.from(oddAllocations.values()).reduce((a, b) => a + b, 0);
  assert('Non-round income sums exactly to basis', Math.abs(oddSum - oddIncome) < 0.001, `Got: ${oddSum} vs ${oddIncome}`);
}

console.log('\n[2] Over / Warn thresholds');
{
  const lines: BudgetLineInputData[] = [
    { id: 'l1', name: 'Under 80%', allocationMethod: 'fixed', allocationValue: 1000, linkedCategoryIds: ['c1'] },
    { id: 'l2', name: 'Warn 80-100%', allocationMethod: 'fixed', allocationValue: 1000, linkedCategoryIds: ['c2'] },
    { id: 'l3', name: 'Over 100%', allocationMethod: 'fixed', allocationValue: 1000, linkedCategoryIds: ['c3'] },
  ];
  const entries: EntryInputData[] = [
    { id: 'e1', amount: 500, type: 'expense', categoryId: 'c1', date: '2026-10-05' }, // 50% -> ok
    { id: 'e2', amount: 850, type: 'expense', categoryId: 'c2', date: '2026-10-05' }, // 85% -> warn
    { id: 'e3', amount: 1200, type: 'expense', categoryId: 'c3', date: '2026-10-05' }, // 120% -> over
  ];
  const res = computeBudgetAnalysis(lines, entries, 3000, 3000);
  const status1 = res.lines.find((l) => l.id === 'l1')?.status;
  const status2 = res.lines.find((l) => l.id === 'l2')?.status;
  const status3 = res.lines.find((l) => l.id === 'l3')?.status;

  assert('50% spend has status ok', status1 === 'ok', `Got: ${status1}`);
  assert('85% spend has status warn', status2 === 'warn', `Got: ${status2}`);
  assert('120% spend has status over', status3 === 'over', `Got: ${status3}`);
}

console.log('\n[3] Unbudgeted bucket');
{
  const lines: BudgetLineInputData[] = [
    { id: 'l1', name: 'Food', allocationMethod: 'fixed', allocationValue: 1000, linkedCategoryIds: ['c1'] },
  ];
  const entries: EntryInputData[] = [
    { id: 'e1', amount: 300, type: 'expense', categoryId: 'c1', date: '2026-10-01' },
    { id: 'e2', amount: 450, type: 'expense', categoryId: 'unmapped_cat', date: '2026-10-02' },
    { id: 'e3', amount: 200, type: 'savings', categoryId: 'unmapped_sav', date: '2026-10-03' },
    { id: 'e4', amount: 999, type: 'income', categoryId: 'inc_cat', date: '2026-10-04' }, // Outflows only
  ];
  const res = computeBudgetAnalysis(lines, entries, 2000, 2000);
  assert('Line 1 spent is 300', res.lines[0].spent === 300, `Got: ${res.lines[0].spent}`);
  assert('Unbudgeted spend is 450 + 200 = 650', res.unbudgetedSpent === 650, `Got: ${res.unbudgetedSpent}`);
  assert('Unbudgeted entries count is 2', res.unbudgetedEntriesCount === 2, `Got: ${res.unbudgetedEntriesCount}`);
  assert('Total spent is 300 + 650 = 950', res.totalSpent === 950, `Got: ${res.totalSpent}`);
}

console.log('\n[4] Median forecast with an outlier');
{
  const values = [1000, 1200, 50000]; // 50,000 is a one-off spike
  const med = calculateMedian(values);
  assert('Median dampens outlier spike (expected 1200)', med === 1200, `Got: ${med}`);

  const history: HistoricalMonthData[] = [
    {
      month: 7,
      year: 2026,
      actualIncome: 50000,
      lineSpends: new Map([['l1', 5000]]),
      totalSpend: 5000,
    },
    {
      month: 8,
      year: 2026,
      actualIncome: 52000,
      lineSpends: new Map([['l1', 5200]]),
      totalSpend: 5200,
    },
    {
      month: 9,
      year: 2026,
      actualIncome: 51000,
      lineSpends: new Map([['l1', 65000]]), // spike
      totalSpend: 65000,
    },
  ];

  const upcoming: UpcomingMonthPlan[] = [
    {
      month: 10,
      year: 2026,
      budgetTotalIncome: 50000,
      lines: [
        { id: 'l1', name: 'Rent', allocationMethod: 'fixed', allocationValue: 6000, linkedCategoryIds: [] },
      ],
      committedPayables: 2000,
    },
  ];

  const forecast = calculateForecast(history, upcoming);
  assert('Forecast history sufficient', !forecast.insufficientHistory);
  assert('Projected spend uses median (5200)', forecast.months[0].projectedSpend === 5200, `Got: ${forecast.months[0].projectedSpend}`);
  assert('No line over-allocation warning because 5200 <= 6000', forecast.months[0].warnings.length === 0);
}

console.log('\n[5] Insufficient history');
{
  const history: HistoricalMonthData[] = [
    {
      month: 9,
      year: 2026,
      actualIncome: 50000,
      lineSpends: new Map(),
      totalSpend: 10000,
    },
  ]; // Only 1 month < 2

  const upcoming: UpcomingMonthPlan[] = [
    {
      month: 10,
      year: 2026,
      lines: [],
      committedPayables: 0,
    },
  ];

  const forecast = calculateForecast(history, upcoming);
  assert('insufficientHistory is true when < 2 months', forecast.insufficientHistory === true);
  assert('warnings array is empty', forecast.months[0].warnings.length === 0);
}

console.log('\n[6] Sub-item note matching');
{
  const lines: BudgetLineInputData[] = [
    {
      id: 'living',
      name: 'Living Cost',
      allocationMethod: 'fixed',
      allocationValue: 20000,
      linkedCategoryIds: [],
      subItemNames: ['Home Rent', 'Wifi Bill'],
    },
    {
      id: 'food',
      name: 'Food',
      allocationMethod: 'fixed',
      allocationValue: 5000,
      linkedCategoryIds: ['food_cat'],
    },
  ];
  const entries: EntryInputData[] = [
    { id: 'e1', amount: 12000, type: 'expense', categoryId: 'rent_cat', date: '2026-11-11', note: 'Home Rent' },
    { id: 'e2', amount: 500, type: 'expense', categoryId: 'rent_cat', date: '2026-11-12', note: '  wifi bill ' },
    { id: 'e3', amount: 4000, type: 'expense', categoryId: 'settlement', date: '2026-11-09', note: '50k remains' },
    { id: 'e4', amount: 700, type: 'expense', categoryId: 'food_cat', date: '2026-11-05', note: 'Groceries' },
  ];
  const res = computeBudgetAnalysis(lines, entries, 40000, 46000);
  const living = res.lines.find((l) => l.id === 'living');
  const food = res.lines.find((l) => l.id === 'food');

  assert('Sub-item notes are counted on the line (12000 + 500)', living?.spent === 12500, `Got: ${living?.spent}`);
  assert('Category link still works alongside sub-items', food?.spent === 700, `Got: ${food?.spent}`);
  assert('Only the unmatched note is unbudgeted (4000)', res.unbudgetedSpent === 4000, `Got: ${res.unbudgetedSpent}`);
  assert('Unbudgeted count counts entries (1)', res.unbudgetedEntriesCount === 1, `Got: ${res.unbudgetedEntriesCount}`);
  assert('Total spent is 12500 + 700 + 4000', res.totalSpent === 17200, `Got: ${res.totalSpent}`);
}

console.log('\n──────────────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
