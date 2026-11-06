import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class SmartBottomNavBar extends StatelessWidget {
  const SmartBottomNavBar({
    super.key,
    required this.items,
    required this.centerAction,
    this.onTap,
    this.onCenterTap,
    this.height = 82,
    this.backgroundColor,
  }) : assert(items.length >= 2, 'SmartBottomNavBar requires at least 2 items');

  final List<Widget> items;
  final Widget centerAction;
  final ValueChanged<int>? onTap;
  final VoidCallback? onCenterTap;
  final double height;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBarBg =
        isDark ? AppColors.darkSurface : (backgroundColor ?? AppColors.paperCard);
    final borderColor = isDark ? AppColors.darkBorder : AppColors.paperMist;
    final splitIndex = (items.length / 2).ceil();
    final leftItems = items.take(splitIndex).toList();
    final rightItems = items.skip(splitIndex).toList();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
        child: Container(
          height: height,
          decoration: BoxDecoration(
            color: navBarBg,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: borderColor, width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(isDark ? 35 : 15),
                blurRadius: 18,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Positioned.fill(
                child: Row(
                  children: [
                    ...leftItems.asMap().entries.map((entry) {
                      final index = entry.key;
                      return Expanded(
                        child: _NavTapTarget(
                          index: index,
                          child: entry.value,
                          onTap: onTap,
                        ),
                      );
                    }),
                    const SizedBox(width: 92),
                    ...rightItems.asMap().entries.map((entry) {
                      final index = splitIndex + entry.key;
                      return Expanded(
                        child: _NavTapTarget(
                          index: index,
                          child: entry.value,
                          onTap: onTap,
                        ),
                      );
                    }),
                  ],
                ),
              ),
              Positioned(
                bottom: 10,
                child: Material(
                  color: AppColors.terra,
                  elevation: 10,
                  shadowColor: AppColors.terra.withAlpha(90),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: onCenterTap,
                    child: SizedBox(
                      width: 64,
                      height: 64,
                      child: Center(child: centerAction),
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

class _NavTapTarget extends StatelessWidget {
  const _NavTapTarget({
    required this.index,
    required this.child,
    required this.onTap,
  });

  final int index;
  final Widget child;
  final ValueChanged<int>? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap == null ? null : () => onTap!(index),
        splashColor: AppColors.terra.withAlpha(20),
        highlightColor: Colors.transparent,
        child: Center(child: child),
      ),
    );
  }
}
