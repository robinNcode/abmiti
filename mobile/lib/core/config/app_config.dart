import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Predefined API environments for Abmiti development and production.
enum ApiEnvironment {
  /// Different router / cellular / isolated network:
  /// Uses ADB reverse port forwarding over USB (adb reverse tcp:5000 tcp:5000).
  /// Any request to 127.0.0.1:5000 on the physical device is forwarded to the PC's port 5000.
  differentRouterUsb(
    id: 'different_router_usb',
    name: 'Different Router (USB / ADB)',
    description: 'PC & Phone on different routers; connected via USB cable (adb reverse)',
    defaultUrl: 'http://127.0.0.1:5000/api/v1',
  ),

  /// Same router / same local network:
  /// Phone and Ubuntu PC connected to the same Wi-Fi or subnet.
  sameRouterLan(
    id: 'same_router_lan',
    name: 'Same Router (LAN IP)',
    description: 'PC & Phone on same Wi-Fi / subnet (PC IP: 192.168.26.65:5000)',
    defaultUrl: 'http://192.168.26.65:5000/api/v1',
  ),

  /// Live production cloud server:
  production(
    id: 'production',
    name: 'Production',
    description: 'Live production server (voltwavebd.com)',
    defaultUrl: 'https://voltwavebd.com/abmiti/api/v1',
  ),

  /// Custom URL (Cloudflare tunnel, ngrok, localtunnel, or custom IP):
  custom(
    id: 'custom',
    name: 'Custom URL / Tunnel',
    description: 'Public HTTPS tunnel (localtunnel / ngrok) or manual URL',
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
    if (id == null) return ApiEnvironment.differentRouterUsb;
    return ApiEnvironment.values.firstWhere(
      (e) => e.id == id || e.name.toLowerCase() == id.toLowerCase(),
      orElse: () => ApiEnvironment.differentRouterUsb,
    );
  }
}

/// Dynamic application configuration manager.
///
/// Priority for resolving active API base URL:
/// 1. Saved custom URL in secure storage (runtime override by developer)
/// 2. Compile-time `--dart-define=API_BASE_URL=...`
/// 3. Compile-time `--dart-define=API_ENV=different_router|same_router|production|custom`
/// 4. Default: Different router via USB (`http://127.0.0.1:5000/api/v1`) in debug,
///    or Production (`https://voltwavebd.com/abmiti/api/v1`) in release.
class AppConfig with ChangeNotifier {
  AppConfig(this._storage);

  final FlutterSecureStorage _storage;

  static const String _storageKeyEnv = 'app_config_api_env';
  static const String _storageKeyUrl = 'app_config_api_url';

  // Compile-time environment defines
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _definedEnv = String.fromEnvironment('API_ENV');
  static const String _definedLanIp = String.fromEnvironment(
    'LAN_IP',
    defaultValue: '192.168.26.65',
  );

  ApiEnvironment _currentEnv = ApiEnvironment.differentRouterUsb;
  String _currentBaseUrl = '';

  ApiEnvironment get currentEnv => _currentEnv;
  String get currentBaseUrl => _currentBaseUrl;

  /// Default same-router URL incorporating LAN_IP define if provided.
  static String get defaultSameRouterUrl =>
      'http://$_definedLanIp:5000/api/v1';

  /// Initial load from storage and compile-time defines.
  Future<void> initialize() async {
    // 1. Check if user saved a preference in secure storage
    final savedEnvId = await _storage.read(key: _storageKeyEnv);
    final savedUrl = await _storage.read(key: _storageKeyUrl);

    if (savedUrl != null && savedUrl.trim().isNotEmpty) {
      _currentBaseUrl = normalizeUrl(savedUrl.trim());
      _currentEnv = ApiEnvironment.fromId(savedEnvId);
      notifyListeners();
      return;
    }

    // 2. Check compile-time --dart-define=API_BASE_URL
    if (_definedBaseUrl.isNotEmpty) {
      _currentBaseUrl = normalizeUrl(_definedBaseUrl);
      _currentEnv = ApiEnvironment.custom;
      notifyListeners();
      return;
    }

    // 3. Check compile-time --dart-define=API_ENV
    if (_definedEnv.isNotEmpty) {
      _currentEnv = _parseEnvName(_definedEnv);
      _currentBaseUrl = _urlForEnv(_currentEnv);
      notifyListeners();
      return;
    }

    // 4. Default by build mode: in release -> production; in debug -> different router (USB)
    if (kReleaseMode) {
      _currentEnv = ApiEnvironment.production;
      _currentBaseUrl = ApiEnvironment.production.defaultUrl;
    } else {
      _currentEnv = ApiEnvironment.differentRouterUsb;
      _currentBaseUrl = ApiEnvironment.differentRouterUsb.defaultUrl;
    }

    notifyListeners();
  }

  /// Switch environment and optionally save a custom URL.
  Future<void> setEnvironment(ApiEnvironment env, {String? customUrl}) async {
    _currentEnv = env;
    if (env == ApiEnvironment.custom && customUrl != null && customUrl.isNotEmpty) {
      _currentBaseUrl = normalizeUrl(customUrl);
      await _storage.write(key: _storageKeyUrl, value: _currentBaseUrl);
    } else {
      _currentBaseUrl = _urlForEnv(env);
      await _storage.write(key: _storageKeyUrl, value: _currentBaseUrl);
    }
    await _storage.write(key: _storageKeyEnv, value: env.id);
    notifyListeners();
  }

  /// Reset to defaults.
  Future<void> resetToDefaults() async {
    await _storage.delete(key: _storageKeyEnv);
    await _storage.delete(key: _storageKeyUrl);
    await initialize();
  }

  static String _urlForEnv(ApiEnvironment env) {
    switch (env) {
      case ApiEnvironment.differentRouterUsb:
        return ApiEnvironment.differentRouterUsb.defaultUrl;
      case ApiEnvironment.sameRouterLan:
        return defaultSameRouterUrl;
      case ApiEnvironment.production:
        return ApiEnvironment.production.defaultUrl;
      case ApiEnvironment.custom:
        return ApiEnvironment.custom.defaultUrl;
    }
  }

  static ApiEnvironment _parseEnvName(String env) {
    switch (env.toLowerCase().replaceAll('-', '_')) {
      case 'prod':
      case 'production':
        return ApiEnvironment.production;
      case 'same_router':
      case 'same':
      case 'lan':
        return ApiEnvironment.sameRouterLan;
      case 'different_router':
      case 'diff':
      case 'usb':
      case 'adb':
        return ApiEnvironment.differentRouterUsb;
      case 'custom':
      case 'tunnel':
        return ApiEnvironment.custom;
      default:
        return ApiEnvironment.differentRouterUsb;
    }
  }

  /// Ensure URL has no trailing slashes.
  static String normalizeUrl(String url) {
    return url.replaceAll(RegExp(r'/+$'), '');
  }
}
