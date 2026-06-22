# Abmiti Mobile (Flutter WebView)

A production-ready Flutter WebView wrapper for the Abmiti personal finance web app.
Supports **Android 6+** and **iOS 13+**.

---

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                  # Entry point + branded splash screen
│   ├── config/
│   │   └── app_config.dart        # ← Change baseUrl here
│   ├── screens/
│   │   └── webview_screen.dart    # Full WebView with offline/error handling
│   └── services/
│       └── connectivity_service.dart
├── android/
│   └── app/
│       ├── build.gradle           # App ID: com.abmiti.app — change as needed
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── kotlin/.../MainActivity.kt
│           └── res/
│               ├── xml/network_security_config.xml  # Dev HTTP allowlist
│               └── values/{colors,styles}.xml
├── ios/
│   └── Runner/
│       └── Info.plist
├── assets/
│   └── html/offline.html          # Shown when device has no internet
└── pubspec.yaml
```

---

## Quick Start

### 1. Install Flutter

```bash
# Linux / macOS
git clone https://github.com/flutter/flutter.git ~/flutter
export PATH="$PATH:$HOME/flutter/bin"
flutter doctor           # follow any instructions
```

### 2. Configure the target URL

Open `lib/config/app_config.dart` and set:

```dart
static const String baseUrl = 'https://abmiti.yoursite.com';
// or for LAN dev:
static const String baseUrl = 'http://192.168.26.65:5173';
```

### 3. Run on Android

```bash
cd mobile
flutter pub get
flutter run              # with an emulator or USB device connected
```

### 4. Build release APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### 5. Build App Bundle (Google Play)

```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### 6. Build for iOS (macOS only)

```bash
flutter build ios --release
# Then open ios/Runner.xcworkspace in Xcode → Archive → Distribute
```

---

## Signing the Android Release

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore ~/abmiti.keystore \
     -alias abmiti -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/keystore.properties`:
   ```properties
   storeFile=/home/yourname/abmiti.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=abmiti
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Rebuild — the `build.gradle` will pick it up automatically.

---

## Features

| Feature | Detail |
|---------|--------|
| WebView engine | `webview_flutter` (Android System WebView / WKWebView on iOS) |
| Back navigation | Hardware back → browser back → "Exit?" dialog |
| Offline detection | Connectivity Plus monitors network changes in real time |
| Error page | Clean in-app error screen with Reload button |
| Splash screen | Branded Flutter splash before first WebView paint |
| Loading indicator | Top progress bar while page loads |
| JS Bridge | `window.FlutterBridge.postMessage(...)` for future native calls |
| Deep links | HTTPS deep links route into the same WebView |
| Security | `network_security_config.xml` restricts cleartext to dev LAN only |

---

## Changing the App Package Name

1. `android/app/build.gradle` → `applicationId "com.abmiti.app"`
2. `android/app/src/main/AndroidManifest.xml` → `android:host`
3. `android/app/src/main/kotlin/com/abmiti/app/MainActivity.kt` → package declaration
4. `ios/Runner/Info.plist` → already uses `$(PRODUCT_BUNDLE_IDENTIFIER)`, set in Xcode project settings

---

## Environment Variants

| Variant | URL | App ID suffix |
|---------|-----|---------------|
| debug | `http://192.168.26.65:5173` | `.debug` |
| release | `https://abmiti.yoursite.com` | (none) |

You can drive this via `--dart-define`:
```bash
flutter run --dart-define=BASE_URL=http://192.168.26.65:5173
```
Then read it in Dart with:
```dart
const baseUrl = String.fromEnvironment('BASE_URL', defaultValue: 'https://abmiti.yoursite.com');
```
