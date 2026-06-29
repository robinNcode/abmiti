import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

import 'core/constants/app_colors.dart';
import 'features/webview/webview_screen.dart';

Future<void> main() async {
  // Preserve the native splash screen until the app is ready
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Brand the system UI
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: AppColors.terra,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
      systemNavigationBarColor: AppColors.ink,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const AbmitiApp());
}

class AbmitiApp extends StatelessWidget {
  const AbmitiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'আবমিতি — Abmiti',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.terra,
          brightness: Brightness.light,
          primary: AppColors.terra,
          onPrimary: AppColors.paper,
          secondary: AppColors.sage,
          onSecondary: AppColors.paper,
          surface: AppColors.paper,
          onSurface: AppColors.ink,
        ),
        scaffoldBackgroundColor: AppColors.paper,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.terra,
          foregroundColor: AppColors.paper,
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: AppColors.terra,
            statusBarIconBrightness: Brightness.light,
          ),
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: AppColors.terraDark,
          contentTextStyle: TextStyle(
            color: AppColors.paper,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      home: const WebViewScreen(),
    );
  }
}
