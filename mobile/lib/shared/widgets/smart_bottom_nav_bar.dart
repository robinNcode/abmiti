import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';

/// Item descriptor for [SmartBottomNavBar].
class NavBarItem {
  const NavBarItem({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;
}

/// Unified, modern floating bottom navigation bar for Abmiti.
///
/// Features:
/// - Supports 4 main items (2 left + center FAB + 2 right).
/// - If [items] is omitted, automatically provides the standard Abmiti items:
///   Overview, Activity, Budget, Analytics.
/// - Active item is enclosed in a stylish terracotta pill (`AppColors.terra`)
///   with white icon and white bold text.
/// - Center floating action button for quick actions.
/// - Seamless Dark and Light theme styling with subtle shadows and borders.
/// - Allows `selectedIndex == null` (or negative) for secondary screens (e.g. Payables/Receivables)
///   so that no main tab is erroneously shown as selected, OR allows passing a selected index.
class SmartBottomNavBar extends StatelessWidget {
  const SmartBottomNavBar({
    super.key,
    this.items,
    this.selectedIndex = 0,
    this.onTap,
    this.onCenterTap,
    this.centerAction,
    this.height = 76,
    this.backgroundColor,
  });

  /// Custom navigation items. If null, the standard 4 Abmiti items are used.
  final List<NavBarItem>? items;

  /// Index of the active item. If null or out of range, no item is highlighted.
  final int? selectedIndex;

  /// Callback when a navigation item is tapped.
  final ValueChanged<int>? onTap;

  /// Callback when the center action button is tapped.
  final VoidCallback? onCenterTap;

  /// Custom center action widget. Defaults to a white `+` icon.
  final Widget? centerAction;

  /// Height of the navigation bar container.
  final double height;

  /// Optional background color override.
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBarBg =
        isDark ? AppColors.darkSurface : (backgroundColor ?? AppColors.paperCard);
    final borderColor = isDark ? AppColors.darkBorder : AppColors.paperMist;

    final navItems = items ??
        [
          NavBarItem(
            icon: Icons.dashboard_rounded,
            label: loc.tr('nav_overview'),
          ),
          NavBarItem(
            icon: Icons.receipt_long_rounded,
            label: loc.tr('nav_activity'),
          ),
          NavBarItem(
            icon: Icons.pie_chart_rounded,
            label: loc.tr('nav_budgets'),
          ),
          NavBarItem(
            icon: Icons.insights_rounded,
            label: loc.tr('nav_analytics'),
          ),
        ];

    final splitIndex = (navItems.length / 2).ceil();
    final leftItems = navItems.take(splitIndex).toList();
    final rightItems = navItems.skip(splitIndex).toList();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
        child: SizedBox(
          height: height,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              // ── Outer Navigation Bar Surface ────────────────────────
              Container(
                height: height,
                decoration: BoxDecoration(
                  color: navBarBg,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: borderColor, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(isDark ? 40 : 14),
                      blurRadius: 18,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Left items
                    ...leftItems.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final item = entry.value;
                      final isActive = selectedIndex == idx;
                      return Expanded(
                        child: _NavTile(
                          item: item,
                          isActive: isActive,
                          isDark: isDark,
                          onTap: () => onTap?.call(idx),
                        ),
                      );
                    }),

                    // Center gap for the FAB
                    const SizedBox(width: 76),

                    // Right items
                    ...rightItems.asMap().entries.map((entry) {
                      final idx = splitIndex + entry.key;
                      final item = entry.value;
                      final isActive = selectedIndex == idx;
                      return Expanded(
                        child: _NavTile(
                          item: item,
                          isActive: isActive,
                          isDark: isDark,
                          onTap: () => onTap?.call(idx),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              // ── Center Floating Action Button ──────────────────────
              Positioned(
                bottom: 8,
                child: Material(
                  color: AppColors.terra,
                  elevation: 8,
                  shadowColor: AppColors.terra.withAlpha(100),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: onCenterTap,
                    child: SizedBox(
                      width: 60,
                      height: 60,
                      child: Center(
                        child: centerAction ??
                            const Icon(
                              Icons.add_rounded,
                              size: 32,
                              color: Colors.white,
                            ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A single navigation item tile with smooth active pill animation.
class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.item,
    required this.isActive,
    required this.isDark,
    required this.onTap,
  });

  final NavBarItem item;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final inactiveIconColor = isDark ? Colors.white70 : AppColors.ink;
    final inactiveTextColor = isDark ? Colors.white60 : AppColors.inkLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: AppColors.terra.withAlpha(25),
          highlightColor: Colors.transparent,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: isActive ? AppColors.terraLight : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: AppColors.terra.withAlpha(80),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    item.icon,
                    size: 20,
                    color: isActive ? Colors.white : inactiveIconColor,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isActive ? Colors.white : inactiveTextColor,
                      fontSize: 10,
                      fontWeight:
                          isActive ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
