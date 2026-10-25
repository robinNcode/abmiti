import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/glossy_card.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loading.dart';

/// Analytics screen with interactive annual trends, warnings, and totals.
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({
    super.key,
    required this.financeRepo,
  });

  final FinanceRepository financeRepo;

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  int _selectedYear = DateTime.now().year;
  bool _loading = true;
  String? _error;

  List<Map<String, dynamic>> _yearlyTrend = [];
  Map<String, dynamic> _yearlySummary = {};
  List<Map<String, dynamic>> _warnings = [];
  int? _selectedMonthIndex;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final trendFuture = widget.financeRepo.fetchYearlyTrend(_selectedYear);
      final summaryFuture =
          widget.financeRepo.fetchYearlySummary(_selectedYear);
      final warningsFuture = widget.financeRepo.fetchBudgetWarnings();

      final results = await Future.wait([
        trendFuture,
        summaryFuture,
        warningsFuture,
      ]);

      if (mounted) {
        setState(() {
          _yearlyTrend = results[0] as List<Map<String, dynamic>>;
          _yearlySummary = results[1] as Map<String, dynamic>;
          _warnings = results[2] as List<Map<String, dynamic>>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = ApiClient.messageFrom(e);
          _loading = false;
        });
      }
    }
  }

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  /// Year selector shown at the top of the analytics body.
  Widget _buildYearPicker(bool isDark) {
    return PopupMenuButton<int>(
      initialValue: _selectedYear,
      onSelected: (year) {
        if (year != _selectedYear) {
          setState(() {
            _selectedYear = year;
            _selectedMonthIndex = null;
          });
          _loadAnalytics();
        }
      },
      itemBuilder: (context) {
        final current = DateTime.now().year;
        return [
          PopupMenuItem(value: current, child: Text('$current')),
          PopupMenuItem(value: current - 1, child: Text('${current - 1}')),
          PopupMenuItem(value: current - 2, child: Text('${current - 2}')),
        ];
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isDark
              ? AppColors.darkElevated
              : AppColors.pastelIce.withAlpha(90),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.pastelPeach.withAlpha(120),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$_selectedYear',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_drop_down, size: 18),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;

    final totalIncome = (_yearlySummary['totalIncome'] as num?) ?? 0;
    final totalExpense = (_yearlySummary['totalExpense'] as num?) ?? 0;
    final totalSavings = (_yearlySummary['totalSavings'] as num?) ?? 0;
    final netSavings = totalIncome - totalExpense;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadAnalytics,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: _buildYearPicker(isDark),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const ShimmerLoading(count: 4)
            else if (_error != null)
              ErrorState(message: _error!, onRetry: _loadAnalytics)
            else ...[
              // ── Annual Totals Hero Card ─────────────────────────────
              GlossyCard(
                gradient: AppColors.iceGlassGradient,
                borderRadius: 22,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$_selectedYear ${loc.tr('net_growth')}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.inkLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatCurrency(netSavings),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _MiniMetric(
                            label: loc.tr('total_earned'),
                            amount: _formatCurrency(totalIncome),
                            color: AppColors.sage,
                          ),
                        ),
                        Expanded(
                          child: _MiniMetric(
                            label: loc.tr('total_spent'),
                            amount: _formatCurrency(totalExpense),
                            color: AppColors.terra,
                          ),
                        ),
                        Expanded(
                          child: _MiniMetric(
                            label: loc.tr('total_saved'),
                            amount: _formatCurrency(totalSavings),
                            color: AppColors.mustard,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // ── Glossy Trend Chart ─────────────────────────────────
              SectionHeader(
                title: loc.tr('trend_title'),
                action: _selectedMonthIndex != null ? loc.tr('reset') : null,
                onAction: () => setState(() => _selectedMonthIndex = null),
              ),
              GlossyCard(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(
                      height: 200,
                      child: _GlossyTrendPainterWidget(
                        trendData: _yearlyTrend,
                        selectedIndex: _selectedMonthIndex,
                        monthLabels: [
                          for (var i = 1; i <= 12; i++) loc.monthShort(i),
                        ],
                        onMonthSelected: (idx) {
                          setState(() => _selectedMonthIndex = idx);
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Legend & Touch Details
                    if (_selectedMonthIndex != null) ...[
                      Builder(builder: (context) {
                        final m = _selectedMonthIndex! + 1;
                        final match = _yearlyTrend.firstWhere(
                          (e) => (e['month'] as num?) == m,
                          orElse: () => {},
                        );
                        final inc = ((match['income'] as num?) ?? 0);
                        final exp = ((match['expense'] as num?) ?? 0);
                        final name = loc.monthName(_selectedMonthIndex! + 1);

                        return Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.pastelCream.withAlpha(150),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 12),
                              ),
                              Row(
                                children: [
                                  Text(
                                    '${loc.tr('income_label')} ${_formatCurrency(inc)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                      color: AppColors.sage,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    '${loc.tr('expense_label')} ${_formatCurrency(exp)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                      color: AppColors.terra,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 12),
                    ],

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _LegendIndicator(
                          color: AppColors.sage,
                          label: loc.tr('income'),
                        ),
                        const SizedBox(width: 24),
                        _LegendIndicator(
                          color: AppColors.terra,
                          label: loc.tr('expense'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Budget Warnings & Advisories ────────────────────────
              if (_warnings.isNotEmpty) ...[
                SectionHeader(title: loc.tr('budget_warnings')),
                ..._warnings.map((w) {
                  final msg = w['message']?.toString() ??
                      loc.tr('budget_warning_default');
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withAlpha(20),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.danger.withAlpha(80),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          color: AppColors.danger,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            msg,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({
    required this.label,
    required this.amount,
    required this.color,
  });

  final String label;
  final String amount;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.inkLight.withAlpha(180),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          amount,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _LegendIndicator extends StatelessWidget {
  const _LegendIndicator({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _GlossyTrendPainterWidget extends StatelessWidget {
  const _GlossyTrendPainterWidget({
    required this.trendData,
    this.selectedIndex,
    required this.onMonthSelected,
    required this.monthLabels,
  });

  final List<Map<String, dynamic>> trendData;
  final int? selectedIndex;
  final ValueChanged<int> onMonthSelected;

  /// Localized abbreviated month labels for the x axis.
  final List<String> monthLabels;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final incomePoints = List<double>.generate(12, (m) {
      final match = trendData.firstWhere(
        (e) => (e['month'] as num?) == m + 1,
        orElse: () => {},
      );
      return ((match['income'] as num?) ?? 0).toDouble();
    });

    final expensePoints = List<double>.generate(12, (m) {
      final match = trendData.firstWhere(
        (e) => (e['month'] as num?) == m + 1,
        orElse: () => {},
      );
      return ((match['expense'] as num?) ?? 0).toDouble();
    });

    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onTapDown: (details) {
            final x = details.localPosition.dx;
            final widthPerMonth = constraints.maxWidth / 12;
            final month = (x / widthPerMonth).floor().clamp(0, 11);
            onMonthSelected(month);
          },
          child: CustomPaint(
            size: Size(constraints.maxWidth, constraints.maxHeight),
            painter: _ChartPainter(
              income: incomePoints,
              expense: expensePoints,
              selectedIndex: selectedIndex,
              isDark: isDark,
              monthLabels: monthLabels,
            ),
          ),
        );
      },
    );
  }
}

class _ChartPainter extends CustomPainter {
  _ChartPainter({
    required this.income,
    required this.expense,
    this.selectedIndex,
    required this.isDark,
    required this.monthLabels,
  });

  final List<double> income;
  final List<double> expense;
  final int? selectedIndex;
  final bool isDark;
  final List<String> monthLabels;

  @override
  void paint(Canvas canvas, Size size) {
    const bottomPadding = 24.0;
    const topPadding = 12.0;
    final chartHeight = size.height - bottomPadding - topPadding;
    final chartWidth = size.width;

    double maxVal = 1000.0;
    for (final v in [...income, ...expense]) {
      if (v > maxVal) maxVal = v;
    }
    maxVal = maxVal * 1.15; // 15% headroom

    // Draw horizontal grid lines
    final gridPaint = Paint()
      ..color = isDark ? Colors.white10 : Colors.black12
      ..strokeWidth = 0.8;

    for (int i = 0; i <= 3; i++) {
      final y = topPadding + (chartHeight / 3) * i;
      canvas.drawLine(Offset(0, y), Offset(chartWidth, y), gridPaint);
    }

    final stepX = chartWidth / 11;

    // Build Income Path
    final incomePath = Path();
    final incomeFill = Path();
    final expensePath = Path();
    final expenseFill = Path();

    for (int i = 0; i < 12; i++) {
      final x = i * stepX;
      final yInc = topPadding + chartHeight * (1.0 - (income[i] / maxVal));
      final yExp = topPadding + chartHeight * (1.0 - (expense[i] / maxVal));

      if (i == 0) {
        incomePath.moveTo(x, yInc);
        incomeFill.moveTo(x, topPadding + chartHeight);
        incomeFill.lineTo(x, yInc);

        expensePath.moveTo(x, yExp);
        expenseFill.moveTo(x, topPadding + chartHeight);
        expenseFill.lineTo(x, yExp);
      } else {
        final prevX = (i - 1) * stepX;
        final prevYInc =
            topPadding + chartHeight * (1.0 - (income[i - 1] / maxVal));
        final prevYExp =
            topPadding + chartHeight * (1.0 - (expense[i - 1] / maxVal));

        final cX = (prevX + x) / 2;
        incomePath.cubicTo(cX, prevYInc, cX, yInc, x, yInc);
        incomeFill.cubicTo(cX, prevYInc, cX, yInc, x, yInc);

        expensePath.cubicTo(cX, prevYExp, cX, yExp, x, yExp);
        expenseFill.cubicTo(cX, prevYExp, cX, yExp, x, yExp);
      }
    }

    incomeFill.lineTo(chartWidth, topPadding + chartHeight);
    incomeFill.close();
    expenseFill.lineTo(chartWidth, topPadding + chartHeight);
    expenseFill.close();

    // Draw fills with gradient
    final incFillPaint = Paint()
      ..shader = LinearGradient(
        colors: [AppColors.sage.withAlpha(50), Colors.transparent],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, chartWidth, chartHeight));
    canvas.drawPath(incomeFill, incFillPaint);

    final expFillPaint = Paint()
      ..shader = LinearGradient(
        colors: [AppColors.terra.withAlpha(45), Colors.transparent],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, chartWidth, chartHeight));
    canvas.drawPath(expenseFill, expFillPaint);

    // Draw lines
    final incLinePaint = Paint()
      ..color = AppColors.sage
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(incomePath, incLinePaint);

    final expLinePaint = Paint()
      ..color = AppColors.terra
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(expensePath, expLinePaint);

    // Month text labels on X axis
    final textStyle = TextStyle(
      color: isDark ? AppColors.darkMuted : AppColors.inkLight,
      fontSize: 10,
      fontWeight: FontWeight.w700,
    );

    for (int i = 0; i < 12; i++) {
      final x = i * stepX;
      final textSpan = TextSpan(text: monthLabels[i], style: textStyle);
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      )..layout();
      textPainter.paint(
        canvas,
        Offset(x - (textPainter.width / 2), size.height - bottomPadding + 6),
      );

      // Selected month touch indicator line
      if (selectedIndex == i) {
        final selectPaint = Paint()
          ..color = AppColors.terra.withAlpha(120)
          ..strokeWidth = 1.5;
        canvas.drawLine(
          Offset(x, topPadding),
          Offset(x, topPadding + chartHeight),
          selectPaint,
        );

        final dotPaint = Paint()..color = AppColors.terra;
        final yExp = topPadding + chartHeight * (1.0 - (expense[i] / maxVal));
        canvas.drawCircle(Offset(x, yExp), 5, dotPaint);

        final incDotPaint = Paint()..color = AppColors.sage;
        final yInc = topPadding + chartHeight * (1.0 - (income[i] / maxVal));
        canvas.drawCircle(Offset(x, yInc), 5, dotDotPaint(incDotPaint));
      }
    }
  }

  Paint dotDotPaint(Paint p) => p;

  @override
  bool shouldRepaint(covariant _ChartPainter oldDelegate) {
    return oldDelegate.income != income ||
        oldDelegate.expense != expense ||
        oldDelegate.selectedIndex != selectedIndex ||
        oldDelegate.isDark != isDark;
  }
}
