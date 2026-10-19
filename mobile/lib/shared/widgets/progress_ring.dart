import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Circular progress ring displaying budget utilization or metric percentage.
class ProgressRing extends StatelessWidget {
  const ProgressRing({
    super.key,
    required this.percentage,
    this.size = 110,
    this.strokeWidth = 10,
    this.primaryColor,
    this.centerContent,
  });

  /// Normalized value from 0.0 to 1.0 (can exceed 1.0 for over budget).
  final double percentage;
  final double size;
  final double strokeWidth;
  final Color? primaryColor;
  final Widget? centerContent;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final clamped = percentage.clamp(0.0, 1.0);
    final isOver = percentage > 1.0;

    final ringColor = primaryColor ??
        (isOver
            ? AppColors.danger
            : clamped > 0.85
                ? AppColors.warning
                : AppColors.sage);

    final trackColor = isDark
        ? AppColors.darkBorder
        : AppColors.pastelIce.withAlpha(120);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _RingPainter(
              progress: clamped,
              strokeWidth: strokeWidth,
              color: ringColor,
              trackColor: trackColor,
            ),
          ),
          centerContent ??
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${(percentage * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: size * 0.22,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppColors.ink,
                    ),
                  ),
                  Text(
                    isOver ? 'Over' : 'Used',
                    style: TextStyle(
                      fontSize: size * 0.12,
                      fontWeight: FontWeight.w600,
                      color: ringColor,
                    ),
                  ),
                ],
              ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.progress,
    required this.strokeWidth,
    required this.color,
    required this.trackColor,
  });

  final double progress;
  final double strokeWidth;
  final Color color;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    final trackPaint = Paint()
      ..color = trackColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final progressPaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Draw background track
    canvas.drawCircle(center, radius, trackPaint);

    // Draw sweep progress
    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.trackColor != trackColor;
  }
}
