# Flutter-specific rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# WebView rules
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Connectivity Plus
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

# URL Launcher
-keep class io.flutter.plugins.urllauncher.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
