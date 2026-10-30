import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Single source of truth for the Mobile API backend base URL.
///
/// Simply change [defaultBaseUrl] here if needed before building or running.
/// Or supply at runtime: `--dart-define=API_BASE_URL=https://...`
class AppConfig with ChangeNotifier {
  AppConfig([FlutterSecureStorage? _]);

  /// ── MANUALLY CONFIGURE BACKEND URL HERE ──────────────────────────────
  /// Change this string anytime before building or testing:
  /// - Production (live cPanel backend):
  ///   'https://robin.adovasoft.com/abmiti-app/api/v1'
  /// - Local development (via adb reverse / localhost):
  ///   'http://127.0.0.1:5000/api/v1'
  static const String defaultBaseUrl =
      'https://robin.adovasoft.com/abmiti-app/api/v1';
  // ──────────────────────────────────────────────────────────────────────

  // Compile-time override: flutter run --dart-define=API_BASE_URL=...
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  String _currentBaseUrl = defaultBaseUrl;

  String get currentBaseUrl => _currentBaseUrl;

  Future<void> initialize() async {
    if (_definedBaseUrl.isNotEmpty) {
      _currentBaseUrl = normalizeUrl(_definedBaseUrl);
    } else {
      _currentBaseUrl = normalizeUrl(defaultBaseUrl);
    }
    notifyListeners();
  }

  /// Ensure URL has no trailing slashes.
  static String normalizeUrl(String url) =>
      url.replaceAll(RegExp(r'/+$'), '');
}
