import 'package:abmiti/features/budgets/budget_screen.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  Map<String, dynamic>? updatedBudgetPayload;
  String? updatedLineId;
  Map<String, dynamic>? updatedLinePayload;
  final List<Map<String, dynamic>> budgetTemplates = [];
  String? savedTemplateName;
  bool duplicateTemplateOnSave = false;
  bool budgetHasLines = true;

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
      budgetHasLines ? _budget : {..._budget, 'lines': <dynamic>[]};

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
  Future<List<Map<String, dynamic>>> fetchCategories({String? type}) async => [
    {'_id': 'cat1', 'name': 'Food', 'icon': '🍽️'},
    {'_id': 'cat2', 'name': 'Transport', 'icon': '🚗'},
  ];

  @override
  Future<List<Map<String, dynamic>>> fetchBudgetTemplates() async =>
      List<Map<String, dynamic>>.from(budgetTemplates);

  @override
  Future<Map<String, dynamic>> saveBudgetAsTemplate(
    String budgetId,
    String templateName,
  ) async {
    savedTemplateName = templateName;
    if (duplicateTemplateOnSave) {
      final path = '/budgets/$budgetId/save-as-template';
      throw DioException(
        requestOptions: RequestOptions(path: path),
        response: Response(
          requestOptions: RequestOptions(path: path),
          statusCode: 409,
          data: {'message': 'A template already exists for this month.'},
        ),
      );
    }
    final template = {
      'month': DateTime.now().month,
      'year': DateTime.now().year,
    };
    budgetTemplates.add(template);
    return template;
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
    expect(find.text('Income: ৳50000'), findsOneWidget);
    expect(find.text('৳6000 / ৳12000'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('saves a template and disables the action for that month',
      (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    final saveButton = find.widgetWithText(OutlinedButton, 'Save template');
    expect(saveButton, findsOneWidget);
    expect(tester.widget<OutlinedButton>(saveButton).onPressed, isNotNull);

    await tester.tap(saveButton);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    final now = DateTime.now();
    expect(fake.savedTemplateName, '${now.month}/${now.year} Budget');
    expect(find.text('Template saved'), findsNWidgets(2));
    final savedButton = find.widgetWithText(OutlinedButton, 'Template saved');
    expect(tester.widget<OutlinedButton>(savedButton).onPressed, isNull);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shows a clear message when the month already has a template',
      (tester) async {
    final fake = _FakeFinanceRepository()..duplicateTemplateOnSave = true;
    await pumpBudget(tester, fake);

    await tester.tap(find.widgetWithText(OutlinedButton, 'Save template'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(
      find.text('A template already exists for this month.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets(
      'disables template saving when the selected month is already saved',
      (tester) async {
    final now = DateTime.now();
    final fake = _FakeFinanceRepository()
      ..budgetTemplates.add({'month': now.month, 'year': now.year});
    await pumpBudget(tester, fake);

    final savedButton = find.widgetWithText(OutlinedButton, 'Template saved');
    expect(savedButton, findsOneWidget);
    expect(tester.widget<OutlinedButton>(savedButton).onPressed, isNull);
    expect(tester.takeException(), isNull);
  });

  testWidgets('requires budget lines before enabling template saving',
      (tester) async {
    final fake = _FakeFinanceRepository()..budgetHasLines = false;
    await pumpBudget(tester, fake);

    final saveButton = find.widgetWithText(
        OutlinedButton, 'Add budget lines before saving a template');
    expect(saveButton, findsOneWidget);
    expect(tester.widget<OutlinedButton>(saveButton).onPressed, isNull);
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

  testWidgets('shows the full budget line editor with icon, color, and notes',
      (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    await tester.tap(find.text('+ Add line'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Add Budget Line'), findsOneWidget);
    expect(find.text('Icon'), findsOneWidget);
    expect(find.text('Color'), findsOneWidget);
    expect(find.text('Note'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('updates the estimated monthly income', (tester) async {
    final fake = _FakeFinanceRepository();
    await pumpBudget(tester, fake);

    await tester.tap(find.text('Edit'));
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
