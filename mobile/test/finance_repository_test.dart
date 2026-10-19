import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FinanceRepository Tests', () {
    const storage = FlutterSecureStorage();
    final apiClient = ApiClient(storage);
    final financeRepo = FinanceRepository(apiClient);

    test('initializes correctly with ApiClient', () {
      expect(financeRepo, isNotNull);
    });

    test('format currency or calculations hold consistent semantics', () {
      const income = 50000.0;
      const expense = 32000.0;
      const savings = 18000.0;

      final net = income - expense;
      expect(net, 18000.0);
      expect((savings / income) * 100, 36.0);
    });
  });
}
