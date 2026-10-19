import 'package:flutter/material.dart';

/// Shimmer skeleton placeholder shown while data is loading.
///
/// Provides a polished loading experience instead of a bare spinner.
class ShimmerLoading extends StatefulWidget {
  const ShimmerLoading({super.key, this.count = 3});

  /// Number of skeleton items to show.
  final int count;

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? const Color(0xFF2A2A2A) : const Color(0xFFEDE5D5);
    final highlightColor = isDark ? const Color(0xFF3A3A3A) : const Color(0xFFF8F0E0);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Column(
          children: List.generate(widget.count, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _ShimmerItem(
                animation: _controller,
                baseColor: baseColor,
                highlightColor: highlightColor,
              ),
            );
          }),
        );
      },
    );
  }
}

class _ShimmerItem extends StatelessWidget {
  const _ShimmerItem({
    required this.animation,
    required this.baseColor,
    required this.highlightColor,
  });

  final Animation<double> animation;
  final Color baseColor;
  final Color highlightColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [baseColor, highlightColor, baseColor],
              stops: [
                (animation.value - 0.3).clamp(0.0, 1.0),
                animation.value.clamp(0.0, 1.0),
                (animation.value + 0.3).clamp(0.0, 1.0),
              ],
            ),
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 14,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [baseColor, highlightColor, baseColor],
                    stops: [
                      (animation.value - 0.3).clamp(0.0, 1.0),
                      animation.value.clamp(0.0, 1.0),
                      (animation.value + 0.3).clamp(0.0, 1.0),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 10,
                width: 120,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [baseColor, highlightColor, baseColor],
                    stops: [
                      (animation.value - 0.3).clamp(0.0, 1.0),
                      animation.value.clamp(0.0, 1.0),
                      (animation.value + 0.3).clamp(0.0, 1.0),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ],
          ),
        ),
      ]),
    );
  }
}
