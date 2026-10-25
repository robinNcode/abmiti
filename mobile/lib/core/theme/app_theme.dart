import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../constants/app_colors.dart';

/// Abmiti design-system theme factory.
///
/// Produces a light and dark [ThemeData] with consistent glossy aesthetics,
/// brand colors, and Material 3 tokens.
class AppTheme {
  AppTheme._();

  // ── Typography ──────────────────────────────────────────────

  static const _fontFamily = 'Roboto';

  static TextTheme _textTheme(Brightness brightness) {
    final color = brightness == Brightness.light ? AppColors.ink : Colors.white;
    return TextTheme(
      headlineLarge: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w800,
          fontSize: 28,
          color: color,
          letterSpacing: -0.5),
      headlineMedium: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w800,
          fontSize: 24,
          color: color),
      headlineSmall: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w800,
          fontSize: 20,
          color: color),
      titleLarge: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w700,
          fontSize: 18,
          color: color),
      titleMedium: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: color),
      titleSmall: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: color),
      bodyLarge: TextStyle(fontFamily: _fontFamily, fontSize: 16, color: color),
      bodyMedium:
          TextStyle(fontFamily: _fontFamily, fontSize: 14, color: color),
      bodySmall: TextStyle(
          fontFamily: _fontFamily, fontSize: 12, color: color.withAlpha(180)),
      labelLarge: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: color),
      labelMedium: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w500,
          fontSize: 12,
          color: color.withAlpha(180)),
      labelSmall: TextStyle(
          fontFamily: _fontFamily,
          fontWeight: FontWeight.w500,
          fontSize: 11,
          letterSpacing: 0.8,
          color: color.withAlpha(140)),
    );
  }

  // ── Light Theme ─────────────────────────────────────────────

  static ThemeData light() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: _fontFamily,
        textTheme: _textTheme(Brightness.light),
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.terra,
          brightness: Brightness.light,
          primary: AppColors.terra,
          onPrimary: Colors.white,
          secondary: AppColors.sage,
          onSecondary: Colors.white,
          tertiary: AppColors.mustard,
          surface: AppColors.paper,
          onSurface: AppColors.ink,
          error: AppColors.danger,
        ),
        scaffoldBackgroundColor: AppColors.paper,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.ink,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
            statusBarBrightness: Brightness.light,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.paperCard,
          indicatorColor: AppColors.terra.withAlpha(30),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 72,
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(
              fontFamily: _fontFamily,
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: AppColors.ink.withAlpha(180),
            ),
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.paperCard,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.paperMist.withAlpha(120),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.paperMist),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.paperMist),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.terra, width: 1.5),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.terra,
            foregroundColor: Colors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: const TextStyle(
              fontFamily: _fontFamily,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.terra,
            side: const BorderSide(color: AppColors.terra),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppColors.terra,
          foregroundColor: Colors.white,
          elevation: 4,
          shape: StadiumBorder(),
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: AppColors.terraDark,
          contentTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.paper,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        ),
        dialogTheme: DialogThemeData(
          backgroundColor: AppColors.paper,
          surfaceTintColor: Colors.transparent,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        ),
        dividerTheme:
            const DividerThemeData(color: AppColors.paperMist, thickness: 1),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.paperMist.withAlpha(150),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          side: BorderSide.none,
        ),
      );

  // ── Dark Theme ──────────────────────────────────────────────

  static ThemeData dark() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: _fontFamily,
        textTheme: _textTheme(Brightness.dark),
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.terra,
          brightness: Brightness.dark,
          primary: AppColors.terraLight,
          onPrimary: Colors.white,
          secondary: AppColors.sageLight,
          onSecondary: Colors.white,
          tertiary: AppColors.mustardLight,
          surface: AppColors.darkSurface,
          onSurface: Colors.white,
          error: AppColors.danger,
        ),
        scaffoldBackgroundColor: AppColors.darkBg,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
            statusBarBrightness: Brightness.dark,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.darkSurface,
          indicatorColor: AppColors.terra.withAlpha(50),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 72,
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(
              fontFamily: _fontFamily,
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: Colors.white.withAlpha(180),
            ),
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.darkElevated,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.darkElevated,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.darkBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.darkBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide:
                const BorderSide(color: AppColors.terraLight, width: 1.5),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.terra,
            foregroundColor: Colors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppColors.terra,
          foregroundColor: Colors.white,
          elevation: 4,
          shape: StadiumBorder(),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.darkElevated,
          contentTextStyle: const TextStyle(
              color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.darkSurface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        ),
        dialogTheme: DialogThemeData(
          backgroundColor: AppColors.darkSurface,
          surfaceTintColor: Colors.transparent,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        ),
        dividerTheme:
            const DividerThemeData(color: AppColors.darkBorder, thickness: 1),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.darkElevated,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          side: BorderSide.none,
        ),
      );
}
