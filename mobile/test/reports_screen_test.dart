import 'package:abmiti/features/reports/reports_screen.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  DateTime? requestedStart;
  DateTime? requestedEnd;
  String? requestedType;

  @override
  Future<Map<String, dynamic>> fetchMonthlySummary(int month, int year) async =>
      {'income': 0, 'expense': 0, 'savings': 0};

  @override
  Future<Map<String, dynamic>> fetchEntries({
    int page = 1,
    int limit = 20,
    String? type,
    int? month,
    int? year,
    DateTime? startDate,
    DateTime? endDate,
    String? categoryId,
  }) async {
    requestedStart = startDate;
    requestedEnd = endDate;
    requestedType = type;
    return {
      'data': [
        {
          '_id': 'e1',
          'amount': '1200.00',
          'note': 'Groceries purchase',
          'type': 'expense',
          'date': '2026-11-02T00:00:00.000Z',
          'category': {
            '_id': 'cat1',
            'name': 'Food',
            'icon': '🍲',
          },
        },
      ],
      'meta': {'totalPages': 1},
    };
  }
}

void main() {
  testWidgets('shows category report entries for a date range', (tester) async {
    final repository = _FakeFinanceRepository();
    await tester.pumpWidget(
      MaterialApp(home: ReportsScreen(financeRepo: repository)),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    final now = DateTime.now();
    expect(repository.requestedType, 'expense');
    expect(repository.requestedStart, DateTime(now.year, now.month, 1));
    expect(
      repository.requestedEnd,
      DateTime(now.year, now.month, now.day),
    );
    await tester.scrollUntilVisible(
      find.text('Food'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Food'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Groceries purchase'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Groceries purchase'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
