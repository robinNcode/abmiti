import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// A premium card with subtle gradient overlay and soft shadow.
///
/// Used across all screens for consistent glossy card treatments.
class GlossyCard extends StatelessWidget {
  const GlossyCard({
    super.key,
    required this.child,
    this.gradient,
    this.padding,
    this.margin,
    this.onTap,
    this.borderRadius = 20,
  });

  final Widget child;
  final Gradient? gradient;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor =
        isDark ? AppColors.darkElevated : AppColors.paperCard;
    final borderColor =
        isDark ? AppColors.darkBorder : AppColors.paperMist;

    final container = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: gradient,
        color: gradient == null ? cardColor : null,
        borderRadius: BorderRadius.circular(borderRadius),
        border: gradient == null
            ? Border.all(color: borderColor, width: 0.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 30 : 12),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: gradient != null
          ? Stack(children: [
              child,
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.glossyOverlay,
                      borderRadius: BorderRadius.circular(borderRadius),
                    ),
                  ),
                ),
              ),
            ])
          : child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: container,
      );
    }
    return container;
  }
}
