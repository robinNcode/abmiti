/// App-wide configuration.
/// Change [baseUrl] to your production URL before building.

class AppConfig {
  AppConfig._();

  static const String appName = 'Abmiti';
  static const String appNameBn = 'আবিমিতি';

  /// The URL loaded in the WebView.
  /// For local dev, use your machine's LAN IP (not localhost — the phone can't reach it).
  /// Example: 'http://192.168.26.65:5173'
  /// For production: 'https://abmiti.yoursite.com'
  static const String baseUrl = 'https://abmiti.yoursite.com';

  /// Fallback/offline page shown when no network is available.
  static const String noNetworkAsset = 'assets/html/offline.html';

  /// Accent color matching the web app's --terra brand color.
  static const int brandColorHex = 0xFFBF6046;

  /// Background while the WebView loads.
  static const int splashColorHex = 0xFFFAF8F5;
}
