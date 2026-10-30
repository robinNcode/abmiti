import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Available theme options for Abmiti.
enum AppThemePreference {
  system,
  light,
  dark,
}

/// Theme manager that handles persisting and notifying theme changes.
class AppThemeModeNotifier extends ChangeNotifier {
  AppThemeModeNotifier([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage() {
    _loadSavedTheme();
  }

  static const String _storageKey = 'app_theme_mode';

  final FlutterSecureStorage _storage;
  // Default is Light as required:
  // "Set Light as the default theme for new installations."
  AppThemePreference _preference = AppThemePreference.light;

  AppThemePreference get preference => _preference;

  ThemeMode get themeMode {
    switch (_preference) {
      case AppThemePreference.system:
        return ThemeMode.system;
      case AppThemePreference.dark:
        return ThemeMode.dark;
      case AppThemePreference.light:
        return ThemeMode.light;
    }
  }

  Future<void> _loadSavedTheme() async {
    try {
      final saved = await _storage.read(key: _storageKey);
      if (saved == 'dark') {
        _preference = AppThemePreference.dark;
        notifyListeners();
      } else if (saved == 'system') {
        _preference = AppThemePreference.system;
        notifyListeners();
      } else if (saved == 'light') {
        _preference = AppThemePreference.light;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> setThemePreference(AppThemePreference pref) async {
    if (_preference == pref) return;
    _preference = pref;
    notifyListeners();
    try {
      String value;
      switch (pref) {
        case AppThemePreference.system:
          value = 'system';
          break;
        case AppThemePreference.dark:
          value = 'dark';
          break;
        case AppThemePreference.light:
          value = 'light';
          break;
      }
      await _storage.write(key: _storageKey, value: value);
    } catch (_) {}
  }
}

/// InheritedWidget or extension to easily access ThemeNotifier in build methods
class ThemeScope extends InheritedNotifier<AppThemeModeNotifier> {
  const ThemeScope({
    super.key,
    required AppThemeModeNotifier themeNotifier,
    required super.child,
  }) : super(notifier: themeNotifier);

  static AppThemeModeNotifier of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ThemeScope>();
    return scope?.notifier ?? AppThemeModeNotifier();
  }
}

extension ThemeExtension on BuildContext {
  AppThemeModeNotifier get appTheme => ThemeScope.of(this);
}
