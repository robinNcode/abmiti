import 'package:abmiti/features/home/entry_form.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  static const _budget = <String, dynamic>{
    '_id': 'b1',
    'month': 11,
    'year': 2026,
    'lines': [
      {
        '_id': 'line1',
        'name': 'Living Cost',
        'icon': '🏠',
        'isActive': true,
        'linkedCategoryIds': ['cat1'],
        'subItems': [
          {'name': 'Home Rent', 'expectedAmount': 10000},
        ],
      },
    ],
  };

  @override
  Future<List<Map<String, dynamic>>> fetchCategories({String? type}) async => [
        {
          '_id': 'cat1',
          'name': 'Housing',
          'icon': '🏠',
          'type': 'expense',
        },
      ];

  @override
  Future<Map<String, dynamic>?> fetchBudget(int month, int year) async =>
      _budget;

  @override
  Future<List<Map<String, dynamic>>> fetchAccounts() async => [];
}

void main() {
  testWidgets('budget sub-item pre-fills entry note and amount',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EntryFormModal(
            financeRepo: _FakeFinanceRepository(),
            onEntryCreated: () {},
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    final budgetLine = find.widgetWithText(ChoiceChip, '🏠 Living Cost');
    expect(budgetLine, findsOneWidget);
    await tester.tap(budgetLine);
    await tester.pump();

    final subItem = find.widgetWithText(ActionChip, 'Home Rent (৳10000)');
    expect(subItem, findsOneWidget);
    await tester.ensureVisible(subItem);
    await tester.tap(subItem);
    await tester.pump();

    final fields =
        tester.widgetList<TextField>(find.byType(TextField)).toList();
    expect(fields.first.controller?.text, '10000');
    expect(fields.last.controller?.text, 'Home Rent');
    expect(tester.takeException(), isNull);
  });
}
