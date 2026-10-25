import 'package:abmiti/features/categories/categories_screen.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  final List<String?> requestedTypes = [];

  @override
  Future<List<Map<String, dynamic>>> fetchCategories({String? type}) async {
    requestedTypes.add(type);
    if (type == 'income') {
      return [
        {
          '_id': 'c2',
          'name': 'Salary',
          'icon': '💼',
          'color': '#4a7c59',
          'type': 'income',
          'isDefault': true,
        },
      ];
    }
    return [
      {
        '_id': 'c1',
        'name': 'Food',
        'icon': '🍔',
        'color': '#e67e22',
        'type': 'expense',
        'isDefault': true,
      },
    ];
  }
}

void main() {
  testWidgets('lists categories for the selected type', (tester) async {
    final fake = _FakeFinanceRepository();
    await tester.pumpWidget(
      MaterialApp(home: CategoriesScreen(financeRepo: fake)),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Food'), findsOneWidget);
    expect(fake.requestedTypes, contains('expense'));
    expect(tester.takeException(), isNull);
  });

  testWidgets('reloads categories when another type tab is selected',
      (tester) async {
    final fake = _FakeFinanceRepository();
    await tester.pumpWidget(
      MaterialApp(home: CategoriesScreen(financeRepo: fake)),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text('Income'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(fake.requestedTypes, contains('income'));
    expect(find.text('Salary'), findsOneWidget);
    expect(find.text('Food'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('opens the category form from the add button', (tester) async {
    final fake = _FakeFinanceRepository();
    await tester.pumpWidget(
      MaterialApp(home: CategoriesScreen(financeRepo: fake)),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('New Category'), findsOneWidget);
    expect(find.text('Category Name'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
