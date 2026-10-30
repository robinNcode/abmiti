import 'package:abmiti/core/theme/theme_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppThemeModeNotifier Tests', () {
    test('defaults to Light theme preference', () {
      final notifier = AppThemeModeNotifier();
      expect(notifier.preference, AppThemePreference.light);
      expect(notifier.themeMode, ThemeMode.light);
    });

    test('updates theme preference to dark and notifies listeners', () async {
      final notifier = AppThemeModeNotifier();
      bool notified = false;
      notifier.addListener(() => notified = true);

      await notifier.setThemePreference(AppThemePreference.dark);
      expect(notifier.preference, AppThemePreference.dark);
      expect(notifier.themeMode, ThemeMode.dark);
      expect(notified, isTrue);
    });

    test('updates theme preference to system/device and notifies listeners', () async {
      final notifier = AppThemeModeNotifier();
      bool notified = false;
      notifier.addListener(() => notified = true);

      await notifier.setThemePreference(AppThemePreference.system);
      expect(notifier.preference, AppThemePreference.system);
      expect(notifier.themeMode, ThemeMode.system);
      expect(notified, isTrue);
    });
  });
}
