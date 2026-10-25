import 'package:abmiti/core/localization/app_locale.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppLocale Localization Tests', () {
    test('defaults to English', () {
      final locale = AppLocale();
      expect(locale.currentLanguage, AppLanguage.en);
      expect(locale.isBengali, isFalse);
      expect(locale.tr('income'), 'Income');
      expect(locale.tr('nav_budgets'), 'Budgets');
    });

    test('switches to Bengali and translates financial terms', () async {
      final locale = AppLocale();
      await locale.setLanguage(AppLanguage.bn);

      expect(locale.currentLanguage, AppLanguage.bn);
      expect(locale.isBengali, isTrue);
      expect(locale.tr('income'), 'আয়');
      expect(locale.tr('expense'), 'ব্যয়');
      expect(locale.tr('savings'), 'সঞ্চয়');
      expect(locale.tr('nav_budgets'), 'বাজেট');
      expect(locale.tr('app_title'), 'অবমিতি');
    });

    test('toggleLanguage toggles back and forth', () async {
      final locale = AppLocale();
      expect(locale.isBengali, isFalse);

      await locale.toggleLanguage();
      expect(locale.isBengali, isTrue);

      await locale.toggleLanguage();
      expect(locale.isBengali, isFalse);
    });
  });
}
