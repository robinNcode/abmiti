import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Metric chip displaying financial indicators (Income, Expense, Balance, Savings).
class StatChip extends StatelessWidget {
  const StatChip({
    super.key,
    required this.label,
    required this.amount,
    required this.icon,
    this.color,
    this.backgroundColor,
  });

  final String label;
  final String amount;
  final IconData icon;
  final Color? color;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = color ?? AppColors.terra;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor ??
            (isDark
                ? AppColors.darkElevated
                : AppColors.pastelCream.withAlpha(200)),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? AppColors.darkBorder
              : AppColors.pastelApricot.withAlpha(140),
          width: 0.8,
        ),
        boxShadow: [
          BoxShadow(
            color: (isDark ? Colors.black : AppColors.pastelPeach)
                .withAlpha(isDark ? 20 : 35),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryColor.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 16, color: primaryColor),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                amount,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppColors.ink,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
