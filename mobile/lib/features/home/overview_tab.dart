import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/glossy_card.dart';
import '../../shared/widgets/progress_ring.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loading.dart';
import '../../shared/widgets/stat_chip.dart';
import 'entry_form.dart';

/// Overview Dashboard Tab with glossy hero card, pastel stat chips,
/// budget utilization progress, and recent entries.
class OverviewTab extends StatefulWidget {
  const OverviewTab({
    super.key,
    required this.financeRepo,
    required this.auth,
    required this.onNavigateToLedger,
    required this.onNavigateToBudgets,
  });

  final FinanceRepository financeRepo;
  final AuthRepository auth;
  final VoidCallback onNavigateToLedger;
  final VoidCallback onNavigateToBudgets;

  @override
  State<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<OverviewTab> {
  bool _loading = true;
  String? _error;

  Map<String, dynamic> _summary = {};
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _recentEntries = [];
  Map<String, dynamic>? _budgetSummary;

  final DateTime _currentDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final month = _currentDate.month;
      final year = _currentDate.year;

      final summaryFuture = widget.financeRepo.fetchMonthlySummary(month, year);
      final categoriesFuture =
          widget.financeRepo.fetchCategoryBreakdown(month, year);
      final entriesFuture = widget.financeRepo.fetchEntries(limit: 5);
      final budgetFuture = widget.financeRepo.fetchBudget(month, year);

      final results = await Future.wait([
        summaryFuture,
        categoriesFuture,
        entriesFuture,
        budgetFuture,
      ]);

      final budget = results[3] as Map<String, dynamic>?;
      Map<String, dynamic>? budgetSum;
      if (budget != null && budget['_id'] != null) {
        budgetSum = await widget.financeRepo
            .fetchBudgetSummary(budget['_id'].toString());
      }

      if (mounted) {
        setState(() {
          _summary = results[0] as Map<String, dynamic>;
          _categories = results[1] as List<Map<String, dynamic>>;
          final entriesRes = results[2] as Map<String, dynamic>;
          _recentEntries = entriesRes['data'] is List
              ? (entriesRes['data'] as List)
                  .map((e) => Map<String, dynamic>.from(e as Map))
                  .toList()
              : [];
          _budgetSummary = budgetSum;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load dashboard data. Please try again.';
          _loading = false;
        });
      }
    }
  }

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: ShimmerLoading(count: 4),
      );
    }

    if (_error != null) {
      return ErrorState(
        message: _error!,
        onRetry: _loadData,
      );
    }

    final income = (_summary['income'] as num?) ?? 0;
    final expense = (_summary['expense'] as num?) ?? 0;
    final savings = (_summary['savings'] as num?) ?? 0;
    final netBalance = income - expense;

    // Budget utilization
    final totalPlanned = (_budgetSummary?['totalPlanned'] as num?) ?? 0;
    final totalActual = (_budgetSummary?['totalActual'] as num?) ?? expense;
    final budgetPercent = totalPlanned > 0
        ? (totalActual / totalPlanned)
        : (income > 0 ? (expense / income) : 0.0);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          // ── Glossy Hero Card ───────────────────────────────────────
          GlossyCard(
            gradient: AppColors.heroGradient,
            borderRadius: 24,
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Net Balance',
                          style: TextStyle(
                            color: Colors.white.withAlpha(200),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatCurrency(netBalance),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                    IconButton.filled(
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withAlpha(45),
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.add_rounded, size: 24),
                      onPressed: () {
                        EntryFormModal.show(
                          context,
                          financeRepo: widget.financeRepo,
                          onEntryCreated: _loadData,
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(35),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _HeroStat(
                        label: 'Income',
                        amount: _formatCurrency(income),
                        color: AppColors.pastelIce,
                        icon: Icons.south_west_rounded,
                      ),
                      Container(
                        height: 28,
                        width: 1,
                        color: Colors.white.withAlpha(50),
                      ),
                      _HeroStat(
                        label: 'Expenses',
                        amount: _formatCurrency(expense),
                        color: AppColors.pastelPeach,
                        icon: Icons.north_east_rounded,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Pastel Quick Metric Chips ──────────────────────────────
          Row(
            children: [
              Expanded(
                child: StatChip(
                  label: 'Savings',
                  amount: _formatCurrency(savings),
                  icon: Icons.savings_outlined,
                  color: AppColors.sage,
                  backgroundColor: AppColors.pastelIce.withAlpha(140),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatChip(
                  label: 'Expense Ratio',
                  amount: income > 0
                      ? '${((expense / income) * 100).toStringAsFixed(0)}%'
                      : '0%',
                  icon: Icons.pie_chart_outline_rounded,
                  color: AppColors.terra,
                  backgroundColor: AppColors.pastelPeach.withAlpha(140),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // ── Budget Utilization Ring Card ───────────────────────────
          GlossyCard(
            onTap: widget.onNavigateToBudgets,
            child: Row(
              children: [
                ProgressRing(
                  percentage: budgetPercent.toDouble(),
                  size: 92,
                  strokeWidth: 8,
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Monthly Budget',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const Spacer(),
                          const Icon(Icons.arrow_forward_ios_rounded,
                              size: 14, color: AppColors.terra),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        totalPlanned > 0
                            ? '${_formatCurrency(totalActual)} spent of ${_formatCurrency(totalPlanned)}'
                            : 'Set up your budget to track limits and stay disciplined.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? AppColors.darkMuted
                              : AppColors.inkLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Category Breakdown ─────────────────────────────────────
          if (_categories.isNotEmpty) ...[
            SectionHeader(
              title: 'Top Categories',
              action: 'View All',
              onAction: widget.onNavigateToLedger,
            ),
            SizedBox(
              height: 76,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final name = cat['categoryName'] ?? 'General';
                  final amount = (cat['total'] as num?) ?? 0;
                  return Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkElevated
                          : AppColors.pastelApricot.withAlpha(90),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.pastelPeach.withAlpha(120),
                        width: 0.8,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          name.toString(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatCurrency(amount),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: AppColors.terra,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
          ],

          // ── Recent Activity ────────────────────────────────────────
          SectionHeader(
            title: 'Recent Transactions',
            action: 'View Ledger',
            onAction: widget.onNavigateToLedger,
          ),
          if (_recentEntries.isEmpty)
            const EmptyState(
              icon: Icons.receipt_long_rounded,
              title: 'No transactions yet',
              subtitle: 'Tap the + button above to log your first expense or income.',
            )
          else
            ..._recentEntries.map((e) {
              final type = e['type']?.toString() ?? 'expense';
              final isExpense = type == 'expense';
              final amount = (e['amount'] as num?) ?? 0;
              final note = e['note']?.toString();
              final cat = e['category'] is Map ? e['category']['name'] : null;
              final title = (note != null && note.isNotEmpty)
                  ? note
                  : (cat ?? (isExpense ? 'Expense' : 'Income'));

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkElevated
                      : AppColors.paperCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkBorder
                        : AppColors.paperMist,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: (isExpense ? AppColors.terra : AppColors.sage)
                            .withAlpha(25),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isExpense
                            ? Icons.arrow_upward_rounded
                            : Icons.arrow_downward_rounded,
                        color: isExpense ? AppColors.terra : AppColors.sage,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          if (cat != null && title != cat)
                            Text(
                              cat.toString(),
                              style: TextStyle(
                                fontSize: 11,
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? AppColors.darkMuted
                                    : AppColors.inkLight,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Text(
                      '${isExpense ? '-' : '+'}${_formatCurrency(amount)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: isExpense ? AppColors.terra : AppColors.sage,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.label,
    required this.amount,
    required this.color,
    required this.icon,
  });

  final String label;
  final String amount;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withAlpha(190),
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              amount,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
