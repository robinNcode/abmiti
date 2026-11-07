import 'package:dio/dio.dart';
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

double _budgetNumberValue(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value.trim()) ?? fallback;
  return fallback;
}

String _budgetStringValue(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  return value.toString();
}

class _BudgetScreenState extends State<BudgetScreen> {
  DateTime _selectedDate = DateTime.now();
  bool _loading = true;
  String? _error;

  Map<String, dynamic>? _budget;
  Map<String, dynamic>? _budgetSummary;
  List<Map<String, dynamic>> _budgetTemplates = [];
  bool _templatesLoading = true;
  bool _templatesLoadFailed = false;
  bool _savingTemplate = false;

  @override
  void initState() {
    super.initState();
    _loadBudget();
    _loadBudgetTemplates();
  }

  Future<void> _refreshBudget() async {
    await Future.wait([_loadBudget(), _loadBudgetTemplates()]);
  }

  Future<void> _loadBudgetTemplates() async {
    if (mounted) {
      setState(() {
        _templatesLoading = true;
        _templatesLoadFailed = false;
      });
    }

    try {
      final templates = await widget.financeRepo.fetchBudgetTemplates();
      if (mounted) {
        setState(() {
          _budgetTemplates = templates;
          _templatesLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _templatesLoading = false;
          _templatesLoadFailed = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.appLocale.tr('template_check_failed')}: ${ApiClient.messageFrom(e)}',
            ),
          ),
        );
      }
    }
  }

  bool get _hasTemplateForSelectedMonth => _budgetTemplates.any(
        (template) =>
            template['month'] == _selectedDate.month &&
            template['year'] == _selectedDate.year,
      );

  bool get _hasBudgetLines =>
      _budget?['lines'] is List && (_budget!['lines'] as List).isNotEmpty;

  Future<void> _saveAsTemplate() async {
    final budget = _budget;
    final budgetId = budget?['_id']?.toString();
    if (budget == null || budgetId == null || budgetId.isEmpty) return;

    final loc = context.appLocale;
    if (_hasTemplateForSelectedMonth) {
      _showTemplateNotice(loc.tr('template_exists'), isError: true);
      return;
    }
    if (!_hasBudgetLines) {
      _showTemplateNotice(loc.tr('add_lines_before_save_template'),
          isError: true);
      return;
    }

    setState(() => _savingTemplate = true);
    try {
      await widget.financeRepo.saveBudgetAsTemplate(
        budgetId,
        '${_selectedDate.month}/${_selectedDate.year} Budget',
      );
      await _loadBudgetTemplates();
      if (mounted) _showTemplateNotice(loc.tr('template_saved'));
    } catch (e) {
      if (mounted) {
        final isDuplicate = e is DioException && e.response?.statusCode == 409;
        _showTemplateNotice(
          isDuplicate ? loc.tr('template_exists') : ApiClient.messageFrom(e),
          isError: true,
        );
      }
    } finally {
      if (mounted) setState(() => _savingTemplate = false);
    }
  }

  void _showTemplateNotice(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: isError ? AppColors.danger : AppColors.sageDark,
          content: Row(
            children: [
              Icon(
                isError
                    ? Icons.info_outline_rounded
                    : Icons.check_circle_outline,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
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

    final categories = await widget.financeRepo.fetchCategories();
    final nameController =
        TextEditingController(text: _budgetStringValue(line?['name']));
    final iconController =
        TextEditingController(text: _budgetStringValue(line?['icon'], fallback: '📦'));
    final colorController = TextEditingController(
      text: _budgetStringValue(line?['color'], fallback: '#4A7C59'),
    );
    final noteController =
        TextEditingController(text: _budgetStringValue(line?['note']));
    final valueController = TextEditingController(
      text: line == null
          ? ''
          : _formatAllocationValue(_budgetNumberValue(line['allocationValue'])),
    );
    String method = _budgetStringValue(line?['allocationMethod'], fallback: 'fixed');
    bool isActive = line == null
        ? true
        : (line['isActive'] is bool
            ? line['isActive'] as bool
            : line['isActive'] == 1 || line['isActive'] == 'true');
    final selectedCategoryIds = <String>{
      ...((line?['linkedCategoryIds'] as List?) ?? []).map((item) => item.toString()),
    };
    final subItems = <Map<String, dynamic>>[
      ...((line?['subItems'] as List?) ?? []).map((item) => {
        'name': _budgetStringValue(item['name']),
        'expectedAmount': _budgetNumberValue(item['expectedAmount']),
        'note': _budgetStringValue(item['note']),
      }),
    ];

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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: nameController,
                        decoration: InputDecoration(
                          labelText: loc.tr('line_name'),
                          hintText: loc.tr('line_name_hint'),
                        ),
                        autofocus: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: iconController,
                        decoration: const InputDecoration(
                          labelText: 'Icon',
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: colorController,
                        decoration: const InputDecoration(
                          labelText: 'Color',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: _parseColor(colorController.text),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: isActive,
                  title: Text(loc.tr('active')),
                  onChanged: (value) {
                    if (value != null) {
                      setDialogState(() => isActive = value);
                    }
                  },
                ),
                if (categories.isEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.mustard.withAlpha(25),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.mustard.withAlpha(90)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 16, color: AppColors.mustard),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            loc.tr('create_category_first_hint'),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 12),
                  Text(
                    loc.tr('linked_expense_categories'),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (selectedCategoryIds.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4, bottom: 4),
                      child: Text(
                        loc.tr('budget_line_link_category_hint'),
                        style: const TextStyle(fontSize: 11, color: AppColors.mustard),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: categories.map((category) {
                      final categoryId = category['_id']?.toString() ??
                          category['id']?.toString() ?? '';
                      final label = '${category['icon'] ?? '📦'} ${category['name'] ?? 'Category'}';
                      final selected = selectedCategoryIds.contains(categoryId);
                      return FilterChip(
                        selected: selected,
                        label: Text(label),
                        onSelected: (value) {
                          setDialogState(() {
                            if (value) {
                              selectedCategoryIds.add(categoryId);
                            } else {
                              selectedCategoryIds.remove(categoryId);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: noteController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Note',
                    hintText: 'Optional line note',
                  ),
                ),
                const SizedBox(height: 12),
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
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Sub-items',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextButton.icon(
                      onPressed: () => setDialogState(() {
                        subItems.add({
                          'name': '',
                          'expectedAmount': 0.0,
                          'note': '',
                        });
                      }),
                      icon: const Icon(Icons.add),
                      label: Text(loc.tr('add')),
                    ),
                  ],
                ),
                ...subItems.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(labelText: 'Name'),
                            controller: TextEditingController(
                              text: _budgetStringValue(item['name']),
                            ),
                            onChanged: (value) =>
                                setDialogState(() => item['name'] = value),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 110,
                          child: TextField(
                            controller: TextEditingController(
                              text: _formatAllocationValue(
                                _budgetNumberValue(item['expectedAmount']),
                              ),
                            ),
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(labelText: 'Amt'),
                            onChanged: (value) => setDialogState(() {
                              item['expectedAmount'] =
                                  double.tryParse(value) ?? 0;
                            }),
                          ),
                        ),
                        IconButton(
                          onPressed: () => setDialogState(() => subItems.removeAt(index)),
                          icon: const Icon(Icons.delete_outline),
                          color: AppColors.danger,
                        ),
                      ],
                    ),
                  );
                }),
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
        'icon': iconController.text.trim().isNotEmpty ? iconController.text.trim() : '📦',
        'color': _normalizeColor(colorController.text),
        'allocationMethod': method,
        'allocationValue': val,
        'linkedCategoryIds': selectedCategoryIds.toList(),
        'subItems': subItems
            .where((item) => (_budgetStringValue(item['name']).trim().isNotEmpty))
            .map((item) => {
                'name': _budgetStringValue(item['name']).trim(),
                'expectedAmount': _budgetNumberValue(item['expectedAmount']),
                if (_budgetStringValue(item['note']).trim().isNotEmpty)
                  'note': _budgetStringValue(item['note']).trim(),
              })
            .toList(),
        'order': 0,
        'isActive': isActive,
        if (noteController.text.trim().isNotEmpty) 'note': noteController.text.trim(),
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
          payload,
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

  Color _parseColor(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return AppColors.sage;
    final normalized = trimmed.startsWith('#') ? trimmed : '#$trimmed';
    try {
      return Color(int.parse(normalized.substring(1), radix: 16) + 0xFF000000);
    } catch (_) {
      return AppColors.sage;
    }
  }

  String _normalizeColor(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return '#4A7C59';
    final normalized = trimmed.startsWith('#') ? trimmed : '#$trimmed';
    return normalized.length == 7 ? normalized : '#4A7C59';
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
        onRefresh: _refreshBudget,
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
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _templatesLoading ||
                          _templatesLoadFailed ||
                          _hasTemplateForSelectedMonth ||
                          !_hasBudgetLines ||
                          _savingTemplate
                      ? null
                      : _saveAsTemplate,
                  icon: Icon(
                    _hasTemplateForSelectedMonth
                        ? Icons.check_circle_outline
                        : Icons.bookmark_add_outlined,
                  ),
                  label: Text(
                    _templatesLoading
                        ? loc.tr('checking_templates')
                        : _templatesLoadFailed
                            ? loc.tr('template_check_failed')
                            : _hasTemplateForSelectedMonth
                                ? loc.tr('template_saved')
                                : !_hasBudgetLines
                                    ? loc.tr('add_lines_before_save_template')
                                    : _savingTemplate
                                        ? loc.tr('saving_template')
                                        : loc.tr('save_template'),
                  ),
                ),
              ),
              const SizedBox(height: 8),

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
