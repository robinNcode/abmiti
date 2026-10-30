import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// A modern, polished bottom navigation bar for Abmiti.
///
/// Features:
/// - Clean, balanced layout with subtle sliding indicator pill
/// - Consistent icon alignment with no broken or awkward vertical displacement
/// - Native SafeArea adaptation and responsive screen sizing
/// - Seamless Dark and Light theme styling with border separation
/// - Retains backward-compatible CurvedNavigationBar class signature and callbacks
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
    this.animationDuration = const Duration(milliseconds: 300),
    this.height = 68.0,
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
    final navBarBg = isDark ? AppColors.darkSurface : widget.color;
    final borderTopColor = isDark ? AppColors.darkBorder : AppColors.paperMist;
    final activePillColor = widget.buttonBackgroundColor ?? AppColors.terra;

    return Container(
      color: widget.backgroundColor,
      child: SafeArea(
        top: false,
        child: Container(
          height: widget.height,
          decoration: BoxDecoration(
            color: navBarBg,
            border: Border(
              top: BorderSide(
                color: borderTopColor,
                width: 1.0,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(isDark ? 35 : 10),
                blurRadius: 16,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final totalWidth = constraints.maxWidth;
              final itemWidth = totalWidth / _length;
              final pillWidth = itemWidth * 0.72 > 56.0 ? 56.0 : itemWidth * 0.72;
              final pillHeight = 44.0;
              final pillLeft = (_pos * totalWidth) + ((itemWidth - pillWidth) / 2);

              return Stack(
                alignment: Alignment.centerLeft,
                children: [
                  // ── Smooth Animated Sliding Indicator Pill ───
                  Positioned(
                    left: pillLeft,
                    width: pillWidth,
                    height: pillHeight,
                    child: Container(
                      decoration: BoxDecoration(
                        color: activePillColor,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: activePillColor.withAlpha(isDark ? 60 : 70),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Nav Bar Items Row ────────────────────────
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: widget.items.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final item = entry.value;
                      final isCurrent = idx == _endingIndex;

                      return Expanded(
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => _buttonTapped(idx),
                            splashColor: AppColors.terra.withAlpha(20),
                            highlightColor: Colors.transparent,
                            child: Center(
                              child: AnimatedScale(
                                scale: isCurrent ? 1.08 : 1.0,
                                duration: const Duration(milliseconds: 200),
                                curve: Curves.easeOutBack,
                                child: item,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

