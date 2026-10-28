import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The two modes the mobile app operates in.
///
/// - [production] — used automatically in release builds (APK / physical device).
///   Points to the live hosted backend.
/// - [local] — used in debug builds. Points to the local dev server.
///   Override with `--dart-define=API_BASE_URL=...` for tunnels / different IPs.
enum ApiEnvironment {
  /// Live production server — always used in release mode.
  production(
    id: 'production',
    name: 'Production',
    description: 'Live server — robin.adovasoft.com',
    defaultUrl: 'https://robin.adovasoft.com/abmiti-app/api/v1',
  ),

  /// Local development server — used in debug mode.
  /// Default: ADB reverse (adb reverse tcp:5000 tcp:5000) so both emulator
  /// and physical device hit the PC's port 5000 via 127.0.0.1.
  local(
    id: 'local',
    name: 'Local Dev',
    description: 'Dev server on this machine (127.0.0.1:5000 via ADB or emulator)',
    defaultUrl: 'http://127.0.0.1:5000/api/v1',
  );

  const ApiEnvironment({
    required this.id,
    required this.name,
    required this.description,
    required this.defaultUrl,
  });

  final String id;
  final String name;
  final String description;
  final String defaultUrl;

  static ApiEnvironment fromId(String? id) {
    if (id == null) return ApiEnvironment.local;
    return ApiEnvironment.values.firstWhere(
      (e) => e.id == id,
      orElse: () => ApiEnvironment.local,
    );
  }
}

/// Dynamic application configuration manager.
///
/// Priority for resolving active API base URL:
/// 1. Compile-time `--dart-define=API_BASE_URL=...`  (tunnel / custom IP)
/// 2. Release mode → production URL automatically
/// 3. Debug mode   → local URL (127.0.0.1:5000)
///
/// The user never needs to switch manually — release = prod, debug = local.
class AppConfig with ChangeNotifier {
  AppConfig(FlutterSecureStorage storage); // kept for API compat; unused internally

  // Compile-time override: flutter run --dart-define=API_BASE_URL=https://...
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  ApiEnvironment _currentEnv = ApiEnvironment.local;
  String _currentBaseUrl = '';

  ApiEnvironment get currentEnv => _currentEnv;
  String get currentBaseUrl => _currentBaseUrl;

  /// Initialise — call once in main() before runApp().
  Future<void> initialize() async {
    // 1. Compile-time override wins (useful for ngrok / LAN IP in debug builds)
    if (_definedBaseUrl.isNotEmpty) {
      _currentBaseUrl = normalizeUrl(_definedBaseUrl);
      // Determine env from URL for display purposes
      _currentEnv = _currentBaseUrl.contains('robin.adovasoft.com')
          ? ApiEnvironment.production
          : ApiEnvironment.local;
      notifyListeners();
      return;
    }

    // 2. Release build → always production
    if (kReleaseMode) {
      _currentEnv = ApiEnvironment.production;
      _currentBaseUrl = ApiEnvironment.production.defaultUrl;
    } else {
      // 3. Debug build → local dev
      _currentEnv = ApiEnvironment.local;
      _currentBaseUrl = ApiEnvironment.local.defaultUrl;
    }

    notifyListeners();
  }

  /// Ensure URL has no trailing slashes.
  static String normalizeUrl(String url) =>
      url.replaceAll(RegExp(r'/+$'), '');
}
