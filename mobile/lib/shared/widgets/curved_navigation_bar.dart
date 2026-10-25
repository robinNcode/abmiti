import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// A polished curved bottom navigation bar modeled after `curved_navigation_bar`.
///
/// Features:
/// - Smooth animated concave curve cutout beneath the active tab
/// - Floating circular active button that glides to the selected position
/// - Fully customizable colors, duration, curves, and height
/// - Zero external dependencies, pure Flutter CustomPainter & AnimationController
class CurvedNavigationBar extends StatefulWidget {
  const CurvedNavigationBar({
    super.key,
    required this.items,
    this.index = 0,
    this.color = AppColors.paperCard,
    this.buttonBackgroundColor,
    this.backgroundColor = Colors.transparent,
    this.onTap,
    this.animationCurve = Curves.easeOutCubic,
    this.animationDuration = const Duration(milliseconds: 350),
    this.height = 70.0,
  })  : assert(items.length >= 2,
            'CurvedNavigationBar must have at least 2 items'),
        assert(0 <= index && index < items.length, 'Index out of bounds');

  final List<Widget> items;
  final int index;
  final Color color;
  final Color? buttonBackgroundColor;
  final Color backgroundColor;
  final ValueChanged<int>? onTap;
  final Curve animationCurve;
  final Duration animationDuration;
  final double height;

  @override
  State<CurvedNavigationBar> createState() => _CurvedNavigationBarState();
}

class _CurvedNavigationBarState extends State<CurvedNavigationBar>
    with SingleTickerProviderStateMixin {
  late double _startingPos;
  int _endingIndex = 0;
  late double _pos;
  late AnimationController _animationController;
  late int _length;

  @override
  void initState() {
    super.initState();
    _length = widget.items.length;
    _pos = widget.index / _length;
    _startingPos = widget.index / _length;
    _endingIndex = widget.index;

    _animationController = AnimationController(
      vsync: this,
      duration: widget.animationDuration,
    );

    _animationController.addListener(() {
      setState(() {
        _pos = _startingPos +
            (_endingIndex / _length - _startingPos) *
                widget.animationCurve.transform(_animationController.value);
      });
    });
  }

  @override
  void didUpdateWidget(CurvedNavigationBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.index != widget.index) {
      _startingPos = _pos;
      _endingIndex = widget.index;
      _animationController.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _buttonTapped(int index) {
    if (_endingIndex != index) {
      widget.onTap?.call(index);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final buttonBg = widget.buttonBackgroundColor ??
        (isDark ? AppColors.terraLight : AppColors.terra);
    final barColor = isDark ? AppColors.darkSurface : widget.color;

    return Container(
      color: widget.backgroundColor,
      height: widget.height,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: <Widget>[
          // ── Curved Bar Background ──────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: CustomPaint(
              painter: _NavCurvePainter(
                startingLoc: _pos,
                itemsLength: _length,
                color: barColor,
              ),
              child: SizedBox(
                height: widget.height - 12,
              ),
            ),
          ),

          // ── Floating Active Circle Button ──────────────────────────
          Positioned(
            top: -22,
            left: _pos * MediaQuery.of(context).size.width +
                (MediaQuery.of(context).size.width / _length - 56) / 2,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: buttonBg,
                shape: BoxShape.circle,
                gradient: AppColors.heroGradient,
                boxShadow: [
                  BoxShadow(
                    color: (isDark ? Colors.black : AppColors.terra)
                        .withAlpha(isDark ? 50 : 80),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: widget.items[_endingIndex],
              ),
            ),
          ),

          // ── Bar Items Row ──────────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SizedBox(
              height: widget.height - 12,
              child: Row(
                children: widget.items.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final item = entry.value;
                  final isCurrent = idx == _endingIndex;

                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => _buttonTapped(idx),
                      child: Center(
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 200),
                          opacity: isCurrent ? 0.0 : 0.7,
                          child: item,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavCurvePainter extends CustomPainter {
  _NavCurvePainter({
    required this.startingLoc,
    required this.itemsLength,
    required this.color,
  });

  final double startingLoc;
  final int itemsLength;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    final width = size.width;
    final itemWidth = width / itemsLength;
    final center = (startingLoc * width) + (itemWidth / 2);

    const curveWidth = 72.0;
    const curveDepth = 30.0;

    final left = center - (curveWidth / 2);
    final right = center + (curveWidth / 2);

    // Start top-left
    path.moveTo(0, 0);

    // Line to start of the curve cutout
    if (left > 0) {
      path.lineTo(left, 0);
    }

    // Bezier curve cutout dip
    path.cubicTo(
      left + (curveWidth * 0.22),
      0,
      center - (curveWidth * 0.22),
      curveDepth,
      center,
      curveDepth,
    );
    path.cubicTo(
      center + (curveWidth * 0.22),
      curveDepth,
      right - (curveWidth * 0.22),
      0,
      right,
      0,
    );

    // Line to top-right
    path.lineTo(width, 0);
    // Line to bottom-right
    path.lineTo(width, size.height);
    // Line to bottom-left
    path.lineTo(0, size.height);
    // Close back to top-left
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_NavCurvePainter oldDelegate) {
    return oldDelegate.startingLoc != startingLoc ||
        oldDelegate.itemsLength != itemsLength ||
        oldDelegate.color != color;
  }
}
