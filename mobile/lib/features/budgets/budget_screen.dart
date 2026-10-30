import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';

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

  /// Prompt for a monthly income amount; returns null when cancelled.
  Future<double?> _promptIncome({
    required String title,
    required String message,
    required String confirmLabel,
    double initial = 50000,
  }) {
    final loc = context.appLocale;
    final incomeController = TextEditingController(
      text: initial == initial.roundToDouble()
          ? initial.toStringAsFixed(0)
          : initial.toString(),
    );

    return showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(message, style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 14),
            TextField(
              controller: incomeController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              decoration: InputDecoration(
                labelText: loc.tr('estimated_income'),
                prefixText: '৳ ',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(loc.tr('cancel')),
          ),
          FilledButton(
            onPressed: () {
              final val = double.tryParse(incomeController.text.trim());
              Navigator.pop(ctx, val);
            },
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
  }

  /// Edit the budget's estimated monthly income (PUT /budgets/:id).
  Future<void> _editIncome() async {
    if (_budget == null || _budget!['_id'] == null) return;
    final loc = context.appLocale;
    final current = (_budget!['totalIncome'] as num?)?.toDouble() ?? 0;

    final income = await _promptIncome(
      title: loc.tr('edit_estimated_income'),
      message: loc.tr('edit_income_hint'),
      confirmLabel: loc.tr('save'),
      initial: current > 0 ? current : 50000,
    );
    if (income == null || income < 0 || !mounted) return;

    try {
      setState(() => _loading = true);
      await widget.financeRepo
          .updateBudget(_budget!['_id'].toString(), {'totalIncome': income});
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

  Future<void> _createQuickBudget() async {
    final loc = context.appLocale;
    final income = await _promptIncome(
      title: loc.tr('create_budget'),
      message: loc.tr('estimated_income_hint'),
      confirmLabel: loc.tr('create'),
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

  Future<void> _showLineDialog({Map<String, dynamic>? line}) async {
    if (_budget == null || _budget!['_id'] == null) return;
    final loc = context.appLocale;
    final budgetId = _budget!['_id'].toString();
    final editing = line != null;

    final nameController =
        TextEditingController(text: line?['name']?.toString() ?? '');
    final valueController = TextEditingController(
      text: line == null
          ? ''
          : _formatAllocationValue((line['allocationValue'] as num?) ?? 0),
    );
    String method = line?['allocationMethod']?.toString() ?? 'fixed';

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            editing ? loc.tr('edit_budget_line') : loc.tr('add_budget_line'),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: loc.tr('line_name'),
                    hintText: loc.tr('line_name_hint'),
                  ),
                  autofocus: true,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: method,
                  decoration:
                      InputDecoration(labelText: loc.tr('allocation_method')),
                  items: [
                    DropdownMenuItem(
                        value: 'fixed', child: Text(loc.tr('fixed_amount'))),
                    DropdownMenuItem(
                        value: 'percentage', child: Text(loc.tr('percentage'))),
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
                    labelText: method == 'fixed'
                        ? loc.tr('amount_bdt')
                        : loc.tr('percent_sign'),
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
              child: Text(loc.tr('cancel')),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(editing ? loc.tr('save') : loc.tr('add')),
            ),
          ],
        ),
      ),
    );

    if (result != true) return;

    final name = nameController.text.trim();
    final val = double.tryParse(valueController.text.trim());
    if (name.isEmpty || val == null || val < 0) return;

    try {
      final payload = {
        'name': name,
        'allocationMethod': method,
        'allocationValue': val,
      };

      if (editing) {
        await widget.financeRepo.updateBudgetLine(
          budgetId,
          line['_id'].toString(),
          payload,
        );
      } else {
        await widget.financeRepo.addBudgetLine(
          budgetId,
          {...payload, 'order': 0},
        );
      }
      _loadBudget();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    }
  }

  /// Open the line dialog prefilled for editing the summary line [lineId].
  Future<void> _editLine(String lineId) async {
    final raw = _rawLine(lineId);
    if (raw == null) return;
    await _showLineDialog(line: raw);
  }

  Map<String, dynamic>? _rawLine(String lineId) {
    final lines = _budget?['lines'];
    if (lines is! List) return null;
    for (final item in lines) {
      if (item is Map && item['_id']?.toString() == lineId) {
        return Map<String, dynamic>.from(item);
      }
    }
    return null;
  }

  String _formatAllocationValue(num value) {
    return value == value.roundToDouble()
        ? value.toStringAsFixed(0)
        : value.toStringAsFixed(2);
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
    final loc = context.appLocale;

    return Scaffold(
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
                title: loc.tr('no_budget_set'),
                subtitle: loc.tr('no_budget_hint'),
                actionLabel: loc.tr('create_budget'),
                action: _createQuickBudget,
              )
            else ...[
              // ── Summary Card (like Overview Tab hero card) ──────────
              Builder(
                builder: (context) {
                  final totalIncome =
                      (_budget?['totalIncome'] as num?) ?? 0;
                  final totalPlanned =
                      (_budgetSummary?['totalPlanned'] as num?) ?? totalIncome;
                  final totalActual =
                      (_budgetSummary?['totalActual'] as num?) ?? 0;
                  final totalVariance =
                      (_budgetSummary?['totalVariance'] as num?) ??
                          (totalPlanned - totalActual);
                  final budgetPercent = totalPlanned > 0
                      ? (totalActual / totalPlanned).toDouble()
                      : (totalIncome > 0
                          ? (totalActual / totalIncome).toDouble()
                          : 0.0);
                  final isOverBudget = budgetPercent > 1.0;

                  final primaryCardBorder = isDark
                      ? AppColors.darkBorder
                      : const Color(0xFFD4E7DC);
                  final cardGradient = LinearGradient(
                    colors: isDark
                        ? [AppColors.darkElevated, const Color(0xFF1E2822)]
                        : [Colors.white, const Color(0xFFEFF7F2)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  );

                  return Container(
                    decoration: BoxDecoration(
                      gradient: cardGradient,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: primaryCardBorder, width: 1.0),
                      boxShadow: [
                        BoxShadow(
                          color: isDark
                              ? Colors.black.withAlpha(50)
                              : AppColors.sage.withAlpha(22),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Stack(
                        children: [
                          // Subtle sage corner accent glow
                          Positioned(
                            top: -40,
                            right: -40,
                            child: Container(
                              width: 140,
                              height: 140,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: RadialGradient(
                                  colors: [
                                    (isDark
                                            ? AppColors.sageLight
                                            : AppColors.sage)
                                        .withAlpha(isDark ? 35 : 22),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(22),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Top Row: Label badge + Quick Edit action
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? AppColors.darkSurface
                                            : AppColors.sage.withAlpha(22),
                                        borderRadius:
                                            BorderRadius.circular(10),
                                        border: Border.all(
                                          color: AppColors.sage
                                              .withAlpha(isDark ? 60 : 40),
                                          width: 0.8,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.pie_chart_rounded,
                                            size: 14,
                                            color: isDark
                                                ? AppColors.sageLight
                                                : AppColors.sage,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            loc.tr('planned_budget'),
                                            style: TextStyle(
                                              color: isDark
                                                  ? Colors.white.withAlpha(220)
                                                  : AppColors.sageDark,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        onTap: _editIncome,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 7),
                                          decoration: BoxDecoration(
                                            color: isDark
                                                ? AppColors.sage.withAlpha(50)
                                                : AppColors.sage.withAlpha(25),
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            border: Border.all(
                                              color: AppColors.sage
                                                  .withAlpha(70),
                                              width: 1,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.edit_outlined,
                                                size: 15,
                                                color: isDark
                                                    ? AppColors.sageLight
                                                    : AppColors.sage,
                                              ),
                                              const SizedBox(width: 5),
                                              Text(
                                                loc.tr('edit'),
                                                style: TextStyle(
                                                  color: isDark
                                                      ? AppColors.sageLight
                                                      : AppColors.sage,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // Amount & Progress Ring Hero Row
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          FittedBox(
                                            fit: BoxFit.scaleDown,
                                            alignment: Alignment.centerLeft,
                                            child: Text(
                                              _formatCurrency(totalPlanned > 0
                                                  ? totalPlanned
                                                  : totalIncome),
                                              style: TextStyle(
                                                color: isDark
                                                    ? Colors.white
                                                    : AppColors.ink,
                                                fontSize: 34,
                                                fontWeight: FontWeight.w900,
                                                letterSpacing: -0.8,
                                                height: 1.1,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons
                                                    .account_balance_wallet_outlined,
                                                size: 13,
                                                color: isDark
                                                    ? AppColors.darkMuted
                                                    : AppColors.inkLight
                                                        .withAlpha(180),
                                              ),
                                              const SizedBox(width: 5),
                                              Text(
                                                '${loc.tr('income')}: ${_formatCurrency(totalIncome)}',
                                                style: TextStyle(
                                                  fontSize: 12,
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
                                    ),
                                    const SizedBox(width: 16),
                                    ProgressRing(
                                      percentage: budgetPercent,
                                      size: 74,
                                      strokeWidth: 7,
                                      primaryColor: isOverBudget
                                          ? AppColors.danger
                                          : (budgetPercent > 0.85
                                              ? AppColors.warning
                                              : AppColors.sage),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),

                                // Supporting metrics row: Total Spent & Remaining
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppColors.darkSurface
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isDark
                                          ? AppColors.darkBorder
                                          : const Color(0xFFDCECE2),
                                      width: 0.8,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: isDark
                                            ? Colors.transparent
                                            : AppColors.sage.withAlpha(12),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: _BudgetMetricItem(
                                          label: loc.tr('total_spent'),
                                          amount:
                                              _formatCurrency(totalActual),
                                          icon: Icons.arrow_upward_rounded,
                                          accentColor: isOverBudget
                                              ? AppColors.danger
                                              : AppColors.terra,
                                          isDark: isDark,
                                        ),
                                      ),
                                      Container(
                                        height: 32,
                                        width: 1,
                                        color: isDark
                                            ? AppColors.darkBorder
                                            : const Color(0xFFDCECE2),
                                      ),
                                      Expanded(
                                        child: _BudgetMetricItem(
                                          label: loc.tr('remaining'),
                                          amount:
                                              _formatCurrency(totalVariance),
                                          icon: totalVariance < 0
                                              ? Icons.warning_amber_rounded
                                              : Icons.check_circle_outline_rounded,
                                          accentColor: totalVariance < 0
                                              ? AppColors.danger
                                              : AppColors.sage,
                                          amountColor: totalVariance < 0
                                              ? AppColors.danger
                                              : (isDark
                                                  ? Colors.white
                                                  : AppColors.ink),
                                          isDark: isDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 22),

              // ── Lines Section ──────────────────────────────────────
              SectionHeader(
                title: loc.tr('budget_allocations'),
                action: '+ ${loc.tr('add_line')}',
                onAction: () => _showLineDialog(),
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
                      color:
                          isDark ? AppColors.darkElevated : AppColors.paperCard,
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
                                if (val == 'edit') _editLine(lineId);
                                if (val == 'delete') _deleteLine(lineId);
                              },
                              itemBuilder: (ctx) => [
                                PopupMenuItem(
                                  value: 'edit',
                                  child: Text(loc.tr('edit_line')),
                                ),
                                PopupMenuItem(
                                  value: 'delete',
                                  child: Text(
                                    loc.tr('delete_line'),
                                    style: const TextStyle(
                                        color: AppColors.danger),
                                  ),
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
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              status == 'over_budget'
                                  ? loc.tr('exceeded_budget')
                                  : status == 'warning'
                                      ? loc.tr('near_threshold')
                                      : loc.tr('on_track'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                            Text(
                              '${percent.toStringAsFixed(0)}% ${loc.tr('used')}',
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
                  title: loc.tr('no_budget_lines'),
                  subtitle: loc.tr('no_budget_lines_hint'),
                  actionLabel: loc.tr('add_line'),
                  action: () => _showLineDialog(),
                ),
            ],
          ],
        ),
      ),
      floatingActionButton: _budget != null
          ? FloatingActionButton(
              onPressed: () => _showLineDialog(),
              child: const Icon(Icons.add_rounded),
            )
          : null,
    );
  }
}

class _BudgetMetricItem extends StatelessWidget {
  const _BudgetMetricItem({
    required this.label,
    required this.amount,
    required this.icon,
    required this.accentColor,
    required this.isDark,
    this.amountColor,
  });

  final String label;
  final String amount;
  final IconData icon;
  final Color accentColor;
  final bool isDark;
  final Color? amountColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: accentColor.withAlpha(isDark ? 35 : 20),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 16,
            color: accentColor,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 1),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  amount,
                  style: TextStyle(
                    color: amountColor ??
                        (isDark ? Colors.white : AppColors.ink),
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
