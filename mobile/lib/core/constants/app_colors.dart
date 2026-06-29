import 'package:flutter/material.dart';

/// Brand color palette for Abmiti — Personal Finance Tracker.
/// Used consistently across the app for native-feel WebView shell.
class AppColors {
  AppColors._();

  /// Primary brand color — terracotta orange
  static const Color terra = Color(0xFFC2552A);

  /// Dark variant of terra, used for pressed states & snackbars
  static const Color terraDark = Color(0xFF9A3D1A);

  /// Sage green — accent / secondary actions
  static const Color sage = Color(0xFF4A7C59);

  /// Mustard yellow — highlights / badges
  static const Color mustard = Color(0xFFD4973E);

  /// Deep ink — primary text
  static const Color ink = Color(0xFF1A1208);

  /// Paper — background / light surfaces
  static const Color paper = Color(0xFFFDF6EC);

  /// Paper mist — secondary surfaces / input fills
  static const Color paperMist = Color(0xFFF0E8D8);
}
