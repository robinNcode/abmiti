import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Interactive Month/Year selector component for reports, summaries, and budgets.
class MonthYearPicker extends StatelessWidget {
  const MonthYearPicker({
    super.key,
    required this.selectedDate,
    required this.onChanged,
  });

  final DateTime selectedDate;
  final ValueChanged<DateTime> onChanged;

  static const List<String> _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  void _previousMonth() {
    final prev = DateTime(selectedDate.year, selectedDate.month - 1, 1);
    onChanged(prev);
  }

  void _nextMonth() {
    final next = DateTime(selectedDate.year, selectedDate.month + 1, 1);
    onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final monthName = _monthNames[selectedDate.month - 1];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkElevated : AppColors.pastelIce.withAlpha(70),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.pastelPeach.withAlpha(120),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left_rounded, size: 22),
            onPressed: _previousMonth,
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.terra),
                const SizedBox(width: 6),
                Text(
                  '$monthName ${selectedDate.year}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: isDark ? Colors.white : AppColors.ink,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right_rounded, size: 22),
            onPressed: _nextMonth,
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }
}
