# Task 3: Flutter WebView Mobile Application — Abmiti

## Context

Abmiti is a personal finance tracker with a fully responsive React + Vite web frontend (Task 2 completed) deployed at `https://voltwavebd.com/abmiti/`. The mobile app wraps this web app in a native Flutter shell. The user must never feel they are using a webview — the experience must be indistinguishable from a native app.

> **Scope change from original Task 3:** The original plan specified a full native Flutter app (Riverpod, Dio, GoRouter, native screens). This task replaces that with a **WebView wrapper** approach, leveraging the already-complete, mobile-responsive web frontend. This eliminates duplicated business logic while still delivering native-feeling UX enhancements.

---

## Objective

Build a Flutter Android/iOS application that:

1. Loads `https://voltwavebd.com/abmiti/login` as the initial screen inside a full-screen WebView.
2. Adds native-shell behaviors (back navigation, exit confirmation, status bar, splash screen, connectivity handling) so the user cannot distinguish it from a native app.
3. Passes app store review criteria and feels polished.

---

## Brand Colors

```dart
// lib/core/constants/app_colors.dart
class AppColors {
  static const terra      = Color(0xFFC2552A);
  static const terraDark  = Color(0xFF9A3D1A);
  static const sage       = Color(0xFF4A7C59);
  static const mustard    = Color(0xFFD4973E);
  static const ink        = Color(0xFF1A1208);
  static const paper      = Color(0xFFFDF6EC);
  static const paperMist  = Color(0xFFF0E8D8);
}
```

---

## Project Structure

```
flutter_app/
├── android/
│   └── app/
│       ├── src/main/AndroidManifest.xml   # Internet permission, fullscreen intent
│       └── build.gradle                   # minSdk 21, targetSdk 34
├── ios/
│   └── Runner/
│       └── Info.plist                     # NSAppTransportSecurity if needed
├── assets/
│   ├── splash/                            # Splash screen assets
│   └── icons/                            # App icon (terra brand color)
├── lib/
│   ├── core/
│   │   └── constants/
│   │       └── app_colors.dart
│   ├── features/
│   │   └── webview/
│   │       ├── webview_screen.dart        # Main WebView screen
│   │       └── webview_controller.dart    # WebView state & logic
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── no_internet_screen.dart
│   │   │   └── loading_overlay.dart
│   │   └── services/
│   │       └── connectivity_service.dart
│   └── main.dart
├── pubspec.yaml
└── README.md
```

---

## Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.7.0          # Official Flutter WebView
  webview_flutter_android: ^3.16.0
  webview_flutter_wkwebview: ^3.13.0
  connectivity_plus: ^6.0.3        # Network state detection
  flutter_native_splash: ^2.4.1    # Native splash screen
  flutter_launcher_icons: ^0.14.1  # App icon generation
  url_launcher: ^6.3.0             # Open external links in browser

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  flutter_native_splash: ^2.4.1
  flutter_launcher_icons: ^0.14.1
```

---

## Implementation Specifications

### 1. `main.dart`

- Set `SystemChrome.setPreferredOrientations` to portrait only (unless the web app is designed for landscape).
- Set `SystemChrome.setSystemUIOverlayStyle` using brand colors:
  - `statusBarColor`: `AppColors.terra`
  - `statusBarIconBrightness`: `Brightness.light`
- `runApp` with `MaterialApp` using `AppColors.terra` as `primaryColor`, no visible debug banner.
- Initial route: `WebViewScreen`.

### 2. `WebViewScreen` — Core WebView

**Initial URL:** `https://voltwavebd.com/abmiti/login`

**WebViewController configuration:**
```dart
controller
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..setBackgroundColor(AppColors.paper)
  ..setNavigationDelegate(NavigationDelegate(
    onPageStarted: (_) => setState(() => _isLoading = true),
    onPageFinished: (_) => setState(() => _isLoading = false),
    onWebResourceError: _handleError,
    onNavigationRequest: _handleNavigationRequest,
  ))
  ..loadRequest(Uri.parse('https://voltwavebd.com/abmiti/login'));
```

**User-Agent:** Set a custom user agent that identifies the platform for the web app to optionally detect:
```dart
await controller.setUserAgent(
  'Mozilla/5.0 (Linux; Android 11) AbmitiApp/1.0',
);
```

**Loading overlay:** While `onPageStarted` is firing and before `onPageFinished`, show a full-screen overlay with the brand splash (terra background + app name in paper color). Do not show a browser-style progress bar — it breaks the native illusion.

**External link handling (`onNavigationRequest`):**
```dart
NavigationRequest onNavigationRequest(NavigationRequest request) {
  final uri = Uri.parse(request.url);
  final isInternal = uri.host.contains('voltwavebd.com');
  if (!isInternal) {
    launchUrl(uri, mode: LaunchMode.externalApplication);
    return NavigationDecision.prevent;
  }
  return NavigationDecision.navigate;
}
```

### 3. Back Button Behavior

Use `PopScope` (Flutter 3.14+) wrapping the `WebView` widget:

```dart
PopScope(
  canPop: false,
  onPopInvokedWithResult: (didPop, result) async {
    if (didPop) return;
    if (await controller.canGoBack()) {
      controller.goBack();         // One press → go back in web history
    } else {
      _handleExitAttempt();        // Already at root → double-tap-to-exit
    }
  },
  child: WebViewWidget(controller: controller),
)
```

**Double-back-to-exit logic:**

```dart
DateTime? _lastBackPressed;

void _handleExitAttempt() {
  final now = DateTime.now();
  if (_lastBackPressed == null ||
      now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
    _lastBackPressed = now;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('আবার চাপলে অ্যাপ বন্ধ হবে'),   // Bengali
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.terraDark,
      ),
    );
  } else {
    SystemNavigator.pop();   // Exit the app
  }
}
```

### 4. No Internet Screen

`connectivity_plus` listens for connectivity changes. On loss of connection, replace the WebView with a branded offline screen:

- Terra background, paper text.
- Abmiti logo/name.
- Message: "ইন্টারনেট সংযোগ নেই" (No internet connection).
- A **Retry** button that re-checks connectivity and reloads the last URL if restored.
- Do not navigate away — remember the last attempted URL and reload it on reconnect.

```dart
// connectivity_service.dart
class ConnectivityService {
  final _controller = StreamController<bool>.broadcast();
  Stream<bool> get onConnectivityChanged => _controller.stream;

  ConnectivityService() {
    Connectivity().onConnectivityChanged.listen((result) {
      _controller.add(result != ConnectivityResult.none);
    });
  }
}
```

### 5. Splash Screen

Use `flutter_native_splash` for a true native splash (not a Flutter widget):

```yaml
# pubspec.yaml additions for flutter_native_splash
flutter_native_splash:
  color: "#C2552A"                # AppColors.terra hex
  image: assets/splash/logo.png  # White/paper colored app logo
  android_12:
    color: "#C2552A"
    icon_background_color: "#C2552A"
    image: assets/splash/logo.png
  fullscreen: true
```

Run: `dart run flutter_native_splash:create`

### 6. App Icon

Use `flutter_launcher_icons`:

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icons/app_icon.png"
  adaptive_icon_background: "#C2552A"
  adaptive_icon_foreground: "assets/icons/app_icon_foreground.png"
```

Run: `dart run flutter_launcher_icons`

### 7. `AndroidManifest.xml` Requirements

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

<application
  android:usesCleartextTraffic="false"
  android:hardwareAccelerated="true"   <!-- Required for smooth WebView -->
  ...>

  <activity
    android:windowSoftInputMode="adjustResize"  <!-- Prevents keyboard covering inputs -->
    android:exported="true"
    ...>
```

### 8. `build.gradle` (app level)

```groovy
android {
  compileSdk 34
  defaultConfig {
    minSdk 21        // Android 5.0+
    targetSdk 34
    versionCode 1
    versionName "1.0.0"
  }
}
```

---

## JavaScript Bridge (Optional Enhancement)

Inject a JS channel so the web app can optionally call native features:

```dart
controller.addJavaScriptChannel(
  'AbmitiNative',
  onMessageReceived: (message) {
    switch (message.message) {
      case 'SHARE':
        // Native share sheet
        break;
      case 'HAPTIC':
        HapticFeedback.lightImpact();
        break;
    }
  },
);
```

The web app can then call `window.AbmitiNative?.postMessage('HAPTIC')` on button taps to get native haptic feedback — deepening the native feel without requiring full native screens.

---

## What This Approach Does NOT Need

Because Task 2 (full mobile-responsive web UI) is complete, the following from the original Task 3 plan are **no longer needed**:

| Original Plan Item | Reason Dropped |
|--------------------|---------------|
| Riverpod providers | State lives in the web app |
| Dio + ApiService | HTTP is handled by the web app |
| `json_serializable` models | No native data layer needed |
| GoRouter + 9 native screens | Web router handles navigation |
| Native charts (fl_chart) | Recharts in web app handles this |
| `flutter_secure_storage` | Web app manages JWT in browser storage |

---

## Deliverables Checklist

- [ ] `flutter_app/` initialized (`flutter create --org com.voltwavebd abmiti`)
- [ ] `pubspec.yaml` with all dependencies above
- [ ] `lib/core/constants/app_colors.dart`
- [ ] `lib/main.dart` — system UI styling, orientation lock, MaterialApp
- [ ] `lib/features/webview/webview_screen.dart` — full WebView implementation
- [ ] `lib/features/webview/webview_controller.dart` — controller initialization
- [ ] `lib/shared/widgets/no_internet_screen.dart` — branded offline screen
- [ ] `lib/shared/widgets/loading_overlay.dart` — branded loading state
- [ ] `lib/shared/services/connectivity_service.dart`
- [ ] Back navigation: one press = web back, double press = exit with Bengali toast
- [ ] External URL handling via `url_launcher`
- [ ] Native splash screen configured and generated
- [ ] App icon configured and generated
- [ ] `AndroidManifest.xml` — internet permission, `adjustResize`, hardware acceleration
- [ ] `android/app/build.gradle` — minSdk 21, targetSdk 34
- [ ] `flutter analyze` passes with zero warnings
- [ ] Debug APK builds successfully (`flutter build apk --debug`)
- [ ] `flutter_app/README.md` — setup, build, and deployment instructions

---

## Quality Standards

- `flutter analyze` must pass with zero warnings or errors.
- The user must never see a URL bar, browser chrome, or any indication of a WebView.
- No visible loading progress bar — use a full branded overlay instead.
- All user-facing strings that are language-specific should default to Bengali where appropriate (toast messages, offline screen copy).
- The app must not crash on network loss — handle it gracefully with the offline screen.
- Keyboard must not cover form inputs (`adjustResize` in manifest).

---

## Notes & Suggestions for the Implementer

1. **Cookie/session persistence:** `webview_flutter` persists cookies by default on Android. No extra configuration needed for JWT sessions stored in `localStorage` or cookies on the web app side.

2. **Pull-to-refresh:** Consider wrapping the WebView in a `RefreshIndicator` and calling `controller.reload()` on pull. This feels very native and is a one-line addition.

3. **File upload support (Android):** If the web app ever needs file picker access (e.g., profile photo), `webview_flutter` on Android requires additional `onShowFileSelector` handling. Flag this for a future task if needed.

4. **iOS WKWebView note:** On iOS, `localStorage` data can be cleared by the OS under memory pressure. If the web app relies on localStorage for auth tokens, consider adding a JS bridge to mirror critical auth state to `flutter_secure_storage` as a future hardening measure.

5. **Version code automation:** Wire `versionCode` to CI build number from day one — avoids manual bumping for Play Store releases.
