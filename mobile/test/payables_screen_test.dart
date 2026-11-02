import 'package:abmiti/features/payables/payables_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('payable amounts accept numeric strings from MySQL JSON responses', () {
    expect(payableAmountValue('10000.00'), 10000);
    expect(payableAmountValue(' 125.5 '), 125.5);
    expect(payableAmountValue(75), 75);
    expect(payableAmountValue(null), 0);
    expect(payableAmountValue('invalid', fallback: 12), 12);
  });

  test('receivable amounts accept numeric strings from MySQL JSON responses', () {
    expect(receivableAmountValue('24000.50'), 24000.5);
    expect(receivableAmountValue(' 100 '), 100);
    expect(receivableAmountValue(42), 42);
    expect(receivableAmountValue(null), 0);
    expect(receivableAmountValue('invalid', fallback: 9), 9);
  });
}
