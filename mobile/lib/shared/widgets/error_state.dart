import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Error state with retry button, icon, and message.
class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    required this.message,
    this.onRetry,
    this.icon = Icons.cloud_off_outlined,
  });

  final String message;
  final VoidCallback? onRetry;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 54, color: AppColors.terra.withAlpha(180)),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ]),
      ),
    );
  }
}
