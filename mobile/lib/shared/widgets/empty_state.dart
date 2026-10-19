import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Branded empty state widget with icon, title, and optional subtitle.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
    this.actionLabel,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? action;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mutedColor = isDark ? AppColors.darkMuted : Colors.black54;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: (isDark ? AppColors.darkElevated : AppColors.paperMist)
                  .withAlpha(180),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(icon, size: 32, color: AppColors.sage),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: TextStyle(color: mutedColor, fontSize: 14, height: 1.5),
            ),
          ],
          if (action != null && actionLabel != null) ...[
            const SizedBox(height: 20),
            FilledButton.tonal(
              onPressed: action,
              child: Text(actionLabel!),
            ),
          ],
        ]),
      ),
    );
  }
}
