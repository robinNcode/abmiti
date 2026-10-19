import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/glossy_card.dart';
import '../../shared/widgets/month_year_picker.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loading.dart';
import '../../shared/widgets/stat_chip.dart';

/// Monthly financial reports screen with category breakdowns and source distribution.
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({
    super.key,
    required this.financeRepo,
  });

  final FinanceRepository financeRepo;

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _selectedDate = DateTime.now();
  bool _loading = true;
  String? _error;

  Map<String, dynamic> _summary = {};
  List<Map<String, dynamic>> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final month = _selectedDate.month;
      final year = _selectedDate.year;

      final summaryFuture = widget.financeRepo.fetchMonthlySummary(month, year);
      final categoriesFuture =
          widget.financeRepo.fetchCategoryBreakdown(month, year);

      final results = await Future.wait([summaryFuture, categoriesFuture]);

      if (mounted) {
        setState(() {
          _summary = results[0] as Map<String, dynamic>;
          _categories = results[1] as List<Map<String, dynamic>>;
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

  void _onDateChanged(DateTime newDate) {
    setState(() => _selectedDate = newDate);
    _loadReport();
  }

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final income = (_summary['income'] as num?) ?? 0;
    final expense = (_summary['expense'] as num?) ?? 0;
    final savings = (_summary['savings'] as num?) ?? 0;
    final net = income - expense;
    final savingsRate =
        income > 0 ? ((savings / income) * 100).clamp(0, 100) : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Monthly Report',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
          children: [
            // ── Month Selector ───────────────────────────────────────
            Center(
              child: MonthYearPicker(
                selectedDate: _selectedDate,
                onChanged: _onDateChanged,
              ),
            ),
            const SizedBox(height: 18),

            if (_loading)
              const ShimmerLoading(count: 4)
            else if (_error != null)
              ErrorState(message: _error!, onRetry: _loadReport)
            else if (income == 0 && expense == 0 && savings == 0)
              const EmptyState(
                icon: Icons.assessment_outlined,
                title: 'No data for this month',
                subtitle:
                    'There are no recorded transactions in this period.',
              )
            else ...[
              // ── Report Glossy Hero Card ─────────────────────────────
              GlossyCard(
                gradient: AppColors.warmGlassGradient,
                borderRadius: 22,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Net Savings',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink.withAlpha(180),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatCurrency(net),
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(140),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Savings Rate',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.inkLight,
                            ),
                          ),
                          Text(
                            '${savingsRate.toStringAsFixed(1)}%',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: AppColors.sage,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // ── Key Metrics Grid ───────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: StatChip(
                      label: 'Total Income',
                      amount: _formatCurrency(income),
                      icon: Icons.arrow_downward_rounded,
                      color: AppColors.sage,
                      backgroundColor: AppColors.pastelIce.withAlpha(140),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatChip(
                      label: 'Total Expense',
                      amount: _formatCurrency(expense),
                      icon: Icons.arrow_upward_rounded,
                      color: AppColors.terra,
                      backgroundColor: AppColors.pastelPeach.withAlpha(140),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Category Spending Breakdown ─────────────────────────
              const SectionHeader(title: 'Spending by Category'),
              if (_categories.isEmpty)
                Text(
                  'No categorized expenses for this month.',
                  style: TextStyle(
                    color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                    fontSize: 13,
                  ),
                )
              else
                ..._categories.map((cat) {
                  final catName =
                      cat['categoryName']?.toString() ?? 'General';
                  final total = (cat['total'] as num?) ?? 0;
                  final percentage =
                      expense > 0 ? (total / expense).clamp(0.0, 1.0) : 0.0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkElevated
                          : AppColors.paperCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark
                            ? AppColors.darkBorder
                            : AppColors.pastelApricot.withAlpha(100),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              catName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              _formatCurrency(total),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: AppColors.terra,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: percentage.toDouble(),
                            minHeight: 8,
                            backgroundColor: isDark
                                ? AppColors.darkBorder
                                : AppColors.pastelIce.withAlpha(120),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.terra,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text(
                            '${(percentage * 100).toStringAsFixed(1)}% of expenses',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkMuted
                                  : AppColors.inkLight,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ],
        ),
      ),
    );
  }
}
