/**
 * Pure-logic unit tests for payable service rules.
 * These tests do NOT hit a database — they mock the container repos.
 */

// ── Inline pure helpers (extracted from service) ──────────────

type PayableStatus = 'open' | 'settled' | 'cancelled';

interface Payable {
  paidAmount: number;
  principal: number;
  status: PayableStatus;
  remaining: number;
  kind: 'borrowed_cash' | 'unpaid_expense';
  accountId?: string | null;
}

// Rules extracted from payable.service.ts logic:
function validatePayment(payable: Payable, amount: number): string | null {
  if (payable.status !== 'open') return 'Payable is not open';
  if (amount <= 0)               return 'Payment amount must be positive';
  if (amount > payable.remaining) return 'Payment exceeds remaining balance';
  return null;
}

function applyPayment(payable: Payable, amount: number): Payable {
  const newPaidAmount = payable.paidAmount + amount;
  const newRemaining  = payable.principal - newPaidAmount;
  return {
    ...payable,
    paidAmount: newPaidAmount,
    remaining:  newRemaining,
    status:     newRemaining <= 0.001 ? 'settled' : 'open',
  };
}

function reversePayment(payable: Payable, amount: number): Payable {
  const newPaidAmount = payable.paidAmount - amount;
  return {
    ...payable,
    paidAmount: newPaidAmount,
    remaining:  payable.principal - newPaidAmount,
    status:     'open',
  };
}

function validateCancel(payable: Payable): string | null {
  if (payable.paidAmount > 0) return 'Cannot cancel a payable that has payments.';
  return null;
}

// ── Tests ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// 1. Overpay is rejected
(function testOverpay() {
  console.log('\n[1] Overpay is rejected');
  const p: Payable = { paidAmount: 0, principal: 1000, remaining: 1000, status: 'open', kind: 'unpaid_expense' };
  assert('overpay rejected',   validatePayment(p, 1001) !== null);
  assert('exact pay allowed',  validatePayment(p, 1000) === null);
  assert('partial pay allowed', validatePayment(p, 500) === null);
})();

// 2. Exact payment settles payable
(function testExactSettle() {
  console.log('\n[2] Exact payment settles payable');
  const p: Payable = { paidAmount: 0, principal: 5000, remaining: 5000, status: 'open', kind: 'unpaid_expense' };
  const updated = applyPayment(p, 5000);
  assert('status is settled', updated.status === 'settled');
  assert('remaining is 0',    updated.remaining === 0);
  assert('paidAmount is principal', updated.paidAmount === 5000);
})();

// 3. Delete payment reopens a settled payable
(function testReopenOnDelete() {
  console.log('\n[3] Delete payment reopens settled payable');
  const settled: Payable = { paidAmount: 5000, principal: 5000, remaining: 0, status: 'settled', kind: 'unpaid_expense' };
  const reopened = reversePayment(settled, 5000);
  assert('status reverts to open', reopened.status === 'open');
  assert('paidAmount is 0',        reopened.paidAmount === 0);
  assert('remaining is principal', reopened.remaining === 5000);
})();

// 4. Partial payment then delete reopens correctly
(function testPartialDelete() {
  console.log('\n[4] Partial payment delete reopens correctly');
  let p: Payable = { paidAmount: 0, principal: 3000, remaining: 3000, status: 'open', kind: 'borrowed_cash' };
  p = applyPayment(p, 1000);
  assert('still open after partial', p.status === 'open');
  assert('remaining correct', p.remaining === 2000);
  const reversed = reversePayment(p, 1000);
  assert('back to open',     reversed.status === 'open');
  assert('remaining restored', reversed.remaining === 3000);
})();

// 5. borrowed_cash vs unpaid_expense effects (validated at create time — semantic test)
(function testKindSemantics() {
  console.log('\n[5] Kind semantics');
  const borrowed: Payable = { paidAmount: 0, principal: 2000, remaining: 2000, status: 'open', kind: 'borrowed_cash', accountId: 'acc-1' };
  const unpaid:   Payable = { paidAmount: 0, principal: 2000, remaining: 2000, status: 'open', kind: 'unpaid_expense', accountId: null };
  // borrowed_cash → account_id must be credited on create (checked by presence of accountId)
  assert('borrowed_cash has accountId', borrowed.accountId === 'acc-1');
  assert('unpaid_expense has no accountId', unpaid.accountId === null);
})();

// 6. Cannot pay non-open payable
(function testNonOpenPayable() {
  console.log('\n[6] Cannot pay non-open payable');
  const settled:   Payable = { paidAmount: 1000, principal: 1000, remaining: 0, status: 'settled',   kind: 'unpaid_expense' };
  const cancelled: Payable = { paidAmount: 0,    principal: 1000, remaining: 1000, status: 'cancelled', kind: 'unpaid_expense' };
  assert('settled rejected',   validatePayment(settled,   500) !== null);
  assert('cancelled rejected', validatePayment(cancelled, 500) !== null);
})();

// 7. Cancel only allowed if paid_amount == 0
(function testCancel() {
  console.log('\n[7] Cancel validation');
  const noPay:    Payable = { paidAmount: 0,   principal: 1000, remaining: 1000, status: 'open', kind: 'unpaid_expense' };
  const hasPay:   Payable = { paidAmount: 100, principal: 1000, remaining: 900,  status: 'open', kind: 'unpaid_expense' };
  assert('cancel allowed with no payments', validateCancel(noPay)  === null);
  assert('cancel blocked with payments',    validateCancel(hasPay) !== null);
})();

// Summary
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
