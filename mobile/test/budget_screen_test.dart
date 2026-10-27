import 'package:abmiti/features/budgets/budget_screen.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  Map<String, dynamic>? updatedBudgetPayload;
  String? updatedLineId;
  Map<String, dynamic>? updatedLinePayload;

  static const _budget = <String, dynamic>{
    '_id': 'b1',
    'month': 10,
    'year': 2026,
    'totalIncome': 50000,
    'lines': [
      {
        '_id': 'l1',
        'name': 'Food',
        'allocationMethod': 'fixed',
        'allocationValue': 12000,
      },
    ],
  };

  static const _summary = <String, dynamic>{
    'budgetId': 'b1',
    'totalIncome': 50000,
    'totalPlanned': 12000,
    'totalActual': 6000,
    'totalVariance': 6000,
    'lines': [
      {
        'lineId': 'l1',
        'name': 'Food',
        'plannedAmount': 12000,
        'actualAmount': 6000,
        'usedPercent': 50,
        'status': 'on_track',
      },
    ],
  };

  @override
  Future<Map<String, dynamic>?> fetchBudget(int month, int year) async =>
      _budget;

  @override
  Future<Map<String, dynamic>?> fetchBudgetSummary(String budgetId) async =>
      _summary;

  @override
  Future<Map<String, dynamic>> updateBudget(
    String budgetId,
    Map<String, dynamic> payload,
  ) async {
    updatedBudgetPayload = payload;
    return _budget;
  }

  @override
  Future<void> updateBudgetLine(
    String budgetId,
    String lineId,
    Map<String, dynamic> lineData,
  ) async {
    updatedLineId = lineId;
    updatedLinePayload = lineData;
  }
}

void main() {
  Future<void> pumpBudget(
      WidgetTester tester, _FakeFinanceRepository fake) async {
    await tester.pumpWidget(
      MaterialApp(home: BudgetScreen(financeRepo: fake)),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  testWidgets('renders the budget summary with its allocation lines',
      (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    expect(find.text('Budget Allocations'), findsOneWidget);
    expect(find.text('Food'), findsOneWidget);
    expect(find.text('Income ৳50000'), findsOneWidget);
    expect(find.text('৳6000 / ৳12000'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('edits a budget line through the line dialog', (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text('Edit Line'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Edit Budget Line'), findsOneWidget);

    final fields = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(fields.first, 'Groceries');
    await tester.enterText(fields.last, '15000');
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(fake.updatedLineId, 'l1');
    expect(fake.updatedLinePayload?['name'], 'Groceries');
    expect(fake.updatedLinePayload?['allocationValue'], 15000);
    expect(tester.takeException(), isNull);
  });

  testWidgets('updates the estimated monthly income', (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    await tester.tap(find.byTooltip('Edit Estimated Income'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Edit Estimated Income'), findsOneWidget);

    final field = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(field, '60000');
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(fake.updatedBudgetPayload, {'totalIncome': 60000.0});
    expect(tester.takeException(), isNull);
  });
}
