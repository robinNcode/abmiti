import 'package:abmiti/features/home/activity_tab.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFinanceRepository extends FinanceRepository {
  _FakeFinanceRepository() : super(ApiClient(const FlutterSecureStorage()));

  DateTime? requestedStart;
  DateTime? requestedEnd;

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
    return {
      'data': <dynamic>[],
      'meta': {'totalPages': 1},
    };
  }
}

void main() {
  testWidgets('loads activity for the current month by default',
      (tester) async {
    final repository = _FakeFinanceRepository();
    await tester.pumpWidget(
      MaterialApp(home: ActivityTab(financeRepo: repository)),
    );
    await tester.pump();

    final now = DateTime.now();
    expect(repository.requestedStart, DateTime(now.year, now.month, 1));
    expect(
      repository.requestedEnd,
      DateTime(now.year, now.month, now.day),
    );
    expect(tester.takeException(), isNull);
  });
}
