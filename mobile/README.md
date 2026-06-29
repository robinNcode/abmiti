# আবমিতি — Flutter Mobile App

A native-feeling Flutter WebView wrapper for the [Abmiti Personal Finance Tracker](https://voltwavebd.com/abmiti/).

---

## Overview

This Flutter application wraps the fully-responsive Abmiti web app (`https://voltwavebd.com/abmiti/`) in a native Android/iOS shell. The user never sees browser chrome — the experience is indistinguishable from a native app.

**Tech Stack:**
- Flutter 3.44.4 (stable)
- webview_flutter ^4.7.0
- connectivity_plus ^6.0.3
- flutter_native_splash ^2.4.1
- flutter_launcher_icons ^0.14.1
- url_launcher ^6.3.0

---

## Prerequisites

| Tool | Version |
|------|---------|
| Flutter | 3.44.4-stable |
| Dart | 3.4.x (bundled) |
| Java (JDK) | 21 (OpenJDK) |
| Android SDK | API 35 |
| Android Build Tools | 34+ |
| Gradle | 8.6 (auto-downloaded) |

### Environment setup

```bash
# Set JAVA_HOME (Ubuntu/Debian)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH

# Verify Flutter
flutter doctor -v
```

---

## Initial Setup (First-time)

```bash
cd mobile/flutter_app

# 1. Get dependencies
flutter pub get

# 2. Generate native splash screen
dart run flutter_native_splash:create

# 3. Generate app icons
dart run flutter_launcher_icons

# 4. Verify no linting issues
flutter analyze
```

---

## Running the App

### Debug (connected device or emulator)

```bash
flutter run
```

### Specific device

```bash
flutter devices          # list available devices
flutter run -d <device-id>
```

---

## Building

### Debug APK

```bash
flutter build apk --debug
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

### Release APK (unsigned)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Release AAB (for Play Store)

```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

> **Signing:** For a signed release build, configure `android/key.properties` and update `android/app/build.gradle` signingConfigs accordingly.

---

## Project Structure

```
flutter_app/
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml     # Permissions + activity config
│   │   │   ├── kotlin/                 # MainActivity.kt
│   │   │   └── res/                    # Drawables, values, icons
│   │   ├── build.gradle                # App-level: minSdk 21, targetSdk 35
│   │   └── proguard-rules.pro          # Release build ProGuard rules
│   ├── build.gradle                    # Project-level: AGP 8.3.2
│   ├── gradle.properties               # AndroidX, Jetifier, JVM settings
│   ├── settings.gradle                 # Module includes + Flutter plugin loader
│   └── gradle/wrapper/
│       └── gradle-wrapper.properties   # Gradle 8.6
├── ios/
│   └── Runner/
│       └── Info.plist                  # iOS config: permissions, orientation
├── assets/
│   ├── icons/
│   │   ├── app_icon.png                # 1024×1024 source icon
│   │   └── app_icon_foreground.png     # Adaptive icon foreground
│   └── splash/
│       └── logo.png                    # Splash screen logo (white on transparent)
├── lib/
│   ├── core/
│   │   └── constants/
│   │       └── app_colors.dart         # Brand color palette
│   ├── features/
│   │   └── webview/
│   │       └── webview_screen.dart     # Main WebView screen
│   ├── shared/
│   │   ├── services/
│   │   │   └── connectivity_service.dart  # Network state listener
│   │   └── widgets/
│   │       ├── loading_overlay.dart    # Branded full-screen loader
│   │       └── no_internet_screen.dart # Offline screen with retry
│   └── main.dart                       # App entry, orientation, system UI
├── analysis_options.yaml               # Lint configuration
└── pubspec.yaml                        # Dependencies + icon/splash config
```

---

## Features

| Feature | Implementation |
|---------|---------------|
| Full-screen WebView | `webview_flutter` 4.7+, no browser chrome |
| Branded loading overlay | Custom `LoadingOverlay` widget with pulsing animation |
| Back navigation | `PopScope` → web history back → double-back-to-exit |
| Exit confirmation toast | Bengali snackbar: "আবার চাপলে অ্যাপ বন্ধ হবে" |
| External URL handling | `url_launcher` opens non-voltwavebd.com URLs in system browser |
| Offline screen | Branded `NoInternetScreen` with Bengali copy + Retry |
| Connectivity listening | `connectivity_plus` v6 stream subscription |
| Native splash | `flutter_native_splash` (true Android/iOS native splash) |
| App icon | `flutter_launcher_icons` + adaptive icon |
| JavaScript bridge | `AbmitiNative.postMessage('HAPTIC')` for native haptics |
| Pull-to-refresh | `RefreshIndicator` → `controller.reload()` |
| Custom user-agent | Identifies `AbmitiApp/1.0` for server-side detection |

---

## JavaScript Bridge

The web app can call native features:

```javascript
// Haptic feedback
window.AbmitiNative?.postMessage('HAPTIC');
window.AbmitiNative?.postMessage('HAPTIC_MEDIUM');
window.AbmitiNative?.postMessage('HAPTIC_HEAVY');
window.AbmitiNative?.postMessage('HAPTIC_SUCCESS');
```

Detect the app shell in JavaScript:

```javascript
const isNativeApp = navigator.userAgent.includes('AbmitiApp');
```

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Terra | `#C2552A` | Primary, status bar, splash, loading |
| Terra Dark | `#9A3D1A` | Pressed states, snackbars |
| Sage | `#4A7C59` | Accent / secondary |
| Mustard | `#D4973E` | Highlights / badges |
| Ink | `#1A1208` | Primary text |
| Paper | `#FDF6EC` | Background / light surfaces |
| Paper Mist | `#F0E8D8` | Secondary surfaces |

---

## Troubleshooting

### `flutter analyze` warnings
```bash
# Run analysis from the flutter_app directory
cd mobile/flutter_app
flutter analyze
```

### Gradle sync fails
1. Verify `JAVA_HOME` points to JDK 21
2. Check `android/local.properties` has `flutter.sdk` and `sdk.dir`
3. Delete `.gradle` cache: `cd android && ./gradlew clean`

### WebView shows blank screen
- Ensure the device/emulator has internet access
- Check `android:usesCleartextTraffic="false"` — the target URL must be HTTPS

### Splash screen not showing
```bash
dart run flutter_native_splash:create
flutter clean && flutter run
```

### App icon not updated
```bash
dart run flutter_launcher_icons
flutter clean && flutter run
```

---

## Deployment

### Android — Play Store

1. Create a signing keystore:
   ```bash
   keytool -genkey -v -keystore abmiti-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias abmiti
   ```
2. Add `android/key.properties` (do not commit):
   ```properties
   storePassword=<password>
   keyPassword=<password>
   keyAlias=abmiti
   storeFile=../abmiti-release.jks
   ```
3. Build the AAB:
   ```bash
   flutter build appbundle --release
   ```
4. Upload `build/app/outputs/bundle/release/app-release.aab` to Play Console.

---

## License

© 2026 VoltWave BD. All rights reserved.
