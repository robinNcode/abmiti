import 'package:flutter/material.dart';

/// Brand color palette for Abmiti — Personal Finance Tracker.
/// Used consistently across the app for native-feel WebView shell.
class AppColors {
  AppColors._();

  /// Primary brand color — terracotta orange
  static const Color terra = Color(0xFFC2552A);

  /// Dark variant of terra, used for pressed states & snackbars
  static const Color terraDark = Color(0xFF9A3D1A);

  /// Light variant of terra, used for tinted surfaces
  static const Color terraLight = Color(0xFFE8845E);

  /// Sage green — accent / secondary actions
  static const Color sage = Color(0xFF4A7C59);

  /// Dark sage for dark-mode accent
  static const Color sageDark = Color(0xFF355A40);

  /// Light sage for tinted surfaces
  static const Color sageLight = Color(0xFF6FA07E);

  /// Mustard yellow — highlights / badges
  static const Color mustard = Color(0xFFD4973E);

  /// Light mustard
  static const Color mustardLight = Color(0xFFE8BC72);

  /// Deep ink — primary text
  static const Color ink = Color(0xFF1A1208);

  /// Secondary ink — slightly lighter for subtitles
  static const Color inkLight = Color(0xFF4A4035);

  /// Paper — background / light surfaces
  static const Color paper = Color(0xFFFDF6EC);

  /// Paper mist — secondary surfaces / input fills
  static const Color paperMist = Color(0xFFF0E8D8);

  /// Paper dark — card surfaces in light mode
  static const Color paperCard = Color(0xFFFFFBF5);

  // ── Dark Mode Palette ──────────────────────────────────────

  /// Dark background
  static const Color darkBg = Color(0xFF121212);

  /// Dark surface / card
  static const Color darkSurface = Color(0xFF1E1E1E);

  /// Dark elevated surface (cards, sheets)
  static const Color darkElevated = Color(0xFF2A2A2A);

  /// Dark muted text
  static const Color darkMuted = Color(0xFF9E9E9E);

  /// Dark border
  static const Color darkBorder = Color(0xFF333333);

  // ── Semantic Colors ────────────────────────────────────────

  /// Success / income
  static const Color success = Color(0xFF2E7D4F);

  /// Warning
  static const Color warning = Color(0xFFE8A317);

  /// Danger / over-budget
  static const Color danger = Color(0xFFD84315);

  // ── Pastel Glass & Glossy Accents ──────────────────────────
  /// User pastel palette:
  /// FFBE91 (warm peach), FFDDB0 (light apricot), FFFCE1 (ivory cream), CFEBFF (soft ice blue)
  static const Color pastelPeach = Color(0xFFFFBE91);
  static const Color pastelApricot = Color(0xFFFFDDB0);
  static const Color pastelCream = Color(0xFFFFFCE1);
  static const Color pastelIce = Color(0xFFCFEBFF);

  // ── Gradient Presets ───────────────────────────────────────

  /// Primary hero card gradient
  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFFD4683A), Color(0xFF9A3D1A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Pastel glow gradient using FFBE91 -> FFDDB0 -> FFFCE1
  static const LinearGradient warmGlassGradient = LinearGradient(
    colors: [Color(0xFFFFBE91), Color(0xFFFFDDB0), Color(0xFFFFFCE1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Cool ice glass gradient using CFEBFF -> FFFCE1
  static const LinearGradient iceGlassGradient = LinearGradient(
    colors: [Color(0xFFCFEBFF), Color(0xFFFFFCE1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Sage card gradient
  static const LinearGradient sageGradient = LinearGradient(
    colors: [Color(0xFF5A9468), Color(0xFF355A40)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Dark hero gradient
  static const LinearGradient darkHeroGradient = LinearGradient(
    colors: [Color(0xFFB84A22), Color(0xFF7A2E10)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Glossy overlay gradient (for card shine effect)
  static LinearGradient glossyOverlay = LinearGradient(
    colors: [
      Colors.white.withAlpha(25),
      Colors.white.withAlpha(8),
      Colors.transparent,
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: const [0.0, 0.4, 1.0],
  );
}
