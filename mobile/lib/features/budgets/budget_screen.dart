import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/glossy_card.dart';
import '../../shared/widgets/month_year_picker.dart';
import '../../shared/widgets/progress_ring.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loading.dart';

/// Comprehensive Budget screen showing monthly allocations, lines, and actuals.
class BudgetScreen extends StatefulWidget {
  const BudgetScreen({
    super.key,
    required this.financeRepo,
  });

  final FinanceRepository financeRepo;

  @override
  State<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends State<BudgetScreen> {
  DateTime _selectedDate = DateTime.now();
  bool _loading = true;
  String? _error;

  Map<String, dynamic>? _budget;
  Map<String, dynamic>? _budgetSummary;

  @override
  void initState() {
    super.initState();
    _loadBudget();
  }

  Future<void> _loadBudget() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final month = _selectedDate.month;
      final year = _selectedDate.year;

      final b = await widget.financeRepo.fetchBudget(month, year);
      Map<String, dynamic>? sum;
      if (b != null && b['_id'] != null) {
        sum = await widget.financeRepo.fetchBudgetSummary(b['_id'].toString());
      }

      if (mounted) {
        setState(() {
          _budget = b;
          _budgetSummary = sum;
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
    _loadBudget();
  }

  Future<void> _createQuickBudget() async {
    final incomeController = TextEditingController(text: '50000');
    final income = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Budget'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Enter your estimated monthly income to start allocating categories:',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: incomeController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Estimated Income',
                prefixText: '৳ ',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final val = double.tryParse(incomeController.text.trim());
              Navigator.pop(ctx, val);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (income == null || income <= 0) return;

    try {
      setState(() => _loading = true);
      await widget.financeRepo.saveBudget({
        'month': _selectedDate.month,
        'year': _selectedDate.year,
        'totalIncome': income,
        'lines': [],
      });
      _loadBudget();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _showAddLineDialog() async {
    if (_budget == null || _budget!['_id'] == null) return;
    final budgetId = _budget!['_id'].toString();

    final nameController = TextEditingController();
    final valueController = TextEditingController();
    String method = 'fixed';

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Budget Line'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Line Name',
                    hintText: 'e.g. Housing, Food, Utilities',
                  ),
                  autofocus: true,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: method,
                  decoration:
                      const InputDecoration(labelText: 'Allocation Method'),
                  items: const [
                    DropdownMenuItem(
                        value: 'fixed', child: Text('Fixed Amount (৳)')),
                    DropdownMenuItem(
                        value: 'percentage', child: Text('Percentage (%)')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() => method = val);
                    }
                  },
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: valueController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText:
                        method == 'fixed' ? 'Amount (৳)' : 'Percent (%)',
                    prefixText: method == 'fixed' ? '৳ ' : null,
                    suffixText: method == 'percentage' ? '%' : null,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );

    if (result != true) return;

    final name = nameController.text.trim();
    final val = double.tryParse(valueController.text.trim());
    if (name.isEmpty || val == null || val <= 0) return;

    try {
      await widget.financeRepo.addBudgetLine(budgetId, {
        'name': name,
        'allocationMethod': method,
        'allocationValue': val,
        'order': 0,
      });
      _loadBudget();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    }
  }

  Future<void> _deleteLine(String lineId) async {
    if (_budget == null || _budget!['_id'] == null) return;
    try {
      await widget.financeRepo
          .deleteBudgetLine(_budget!['_id'].toString(), lineId);
      _loadBudget();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    }
  }

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'over_budget':
        return AppColors.danger;
      case 'warning':
        return AppColors.warning;
      case 'on_track':
        return AppColors.sage;
      default:
        return AppColors.inkLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Budgets',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadBudget,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 80),
          children: [
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
              ErrorState(message: _error!, onRetry: _loadBudget)
            else if (_budget == null)
              EmptyState(
                icon: Icons.account_balance_wallet_outlined,
                title: 'No budget set for this month',
                subtitle:
                    'Create a monthly budget to set allocation targets and prevent overspending.',
                actionLabel: 'Create Budget',
                action: _createQuickBudget,
              )
            else ...[
              // ── Summary Card ───────────────────────────────────────
              GlossyCard(
                gradient: AppColors.heroGradient,
                borderRadius: 22,
                padding: const EdgeInsets.all(20),
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
                              'Planned Budget',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withAlpha(200),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatCurrency(
                                  (_budgetSummary?['totalPlanned'] as num?) ??
                                      (_budget?['totalIncome'] as num?) ??
                                      0),
                              style: const TextStyle(
                                fontSize: 30,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        ProgressRing(
                          percentage: ((_budgetSummary?['totalPlanned']
                                          as num?) ??
                                      0) >
                                  0
                              ? (((_budgetSummary?['totalActual'] as num?) ??
                                      0) /
                                  ((_budgetSummary?['totalPlanned'] as num?) ??
                                      1))
                              : 0.0,
                          size: 74,
                          strokeWidth: 7,
                          primaryColor: Colors.white,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.black.withAlpha(35),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _BudgetMiniStat(
                            label: 'Total Spent',
                            amount: _formatCurrency(
                                (_budgetSummary?['totalActual'] as num?) ?? 0),
                            color: AppColors.pastelPeach,
                          ),
                          Container(
                            height: 24,
                            width: 1,
                            color: Colors.white.withAlpha(50),
                          ),
                          _BudgetMiniStat(
                            label: 'Remaining',
                            amount: _formatCurrency(
                                (_budgetSummary?['totalVariance'] as num?) ??
                                    0),
                            color: AppColors.pastelIce,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // ── Lines Section ──────────────────────────────────────
              SectionHeader(
                title: 'Budget Allocations',
                action: '+ Add Line',
                onAction: _showAddLineDialog,
              ),

              if (_budgetSummary?['lines'] is List &&
                  (_budgetSummary!['lines'] as List).isNotEmpty)
                ...(_budgetSummary!['lines'] as List).map((l) {
                  final lineId = l['lineId']?.toString() ?? '';
                  final name = l['name']?.toString() ?? 'Allocation';
                  final planned = (l['plannedAmount'] as num?) ?? 0;
                  final actual = (l['actualAmount'] as num?) ?? 0;
                  final percent = (l['usedPercent'] as num?) ?? 0;
                  final status = l['status']?.toString();
                  final statusColor = _getStatusColor(status);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkElevated
                          : AppColors.paperCard,
                      borderRadius: BorderRadius.circular(18),
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
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: statusColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            Text(
                              '${_formatCurrency(actual)} / ${_formatCurrency(planned)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                            PopupMenuButton<String>(
                              onSelected: (val) {
                                if (val == 'delete') _deleteLine(lineId);
                              },
                              itemBuilder: (ctx) => [
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Text('Delete Line',
                                      style:
                                          TextStyle(color: AppColors.danger)),
                                ),
                              ],
                              icon: const Icon(Icons.more_vert, size: 18),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: (percent / 100).clamp(0.0, 1.0).toDouble(),
                            minHeight: 8,
                            backgroundColor: isDark
                                ? AppColors.darkBorder
                                : AppColors.pastelIce.withAlpha(120),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              statusColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              status == 'over_budget'
                                  ? 'Exceeded budget'
                                  : status == 'warning'
                                      ? 'Near threshold'
                                      : 'On track',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                            Text(
                              '${percent.toStringAsFixed(0)}% used',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? AppColors.darkMuted
                                    : AppColors.inkLight,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                })
              else
                EmptyState(
                  icon: Icons.list_alt_rounded,
                  title: 'No budget lines yet',
                  subtitle:
                      'Tap "+ Add Line" above to split your monthly budget into categories.',
                  actionLabel: 'Add Line',
                  action: _showAddLineDialog,
                ),
            ],
          ],
        ),
      ),
      floatingActionButton: _budget != null
          ? FloatingActionButton(
              onPressed: _showAddLineDialog,
              child: const Icon(Icons.add_rounded),
            )
          : null,
    );
  }
}

class _BudgetMiniStat extends StatelessWidget {
  const _BudgetMiniStat({
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
            color: Colors.white.withAlpha(190),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          amount,
          style: TextStyle(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
