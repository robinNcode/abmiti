import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
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
  DateTime _reportStart = DateTime(
    DateTime.now().year,
    DateTime.now().month,
    1,
  );
  DateTime _reportEnd = DateTime(
    DateTime.now().year,
    DateTime.now().month,
    DateTime.now().day,
  );
  String _reportType = 'expense';
  String? _reportCategoryId;
  bool _loading = true;
  String? _error;

  Map<String, dynamic> _summary = {};
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _reportEntries = [];

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
      final results = await Future.wait([summaryFuture]);
      final rangeReport = await _fetchCategoryTotals();

      if (mounted) {
        setState(() {
          _summary = results.first;
          _categories = rangeReport.categories;
          _reportEntries = rangeReport.entries;
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
    final now = DateTime.now();
    final lastDay = DateTime(newDate.year, newDate.month + 1, 0).day;
    setState(() {
      _selectedDate = newDate;
      _reportStart = DateTime(newDate.year, newDate.month, 1);
      _reportEnd = newDate.year == now.year && newDate.month == now.month
          ? DateTime(now.year, now.month, now.day)
          : DateTime(newDate.year, newDate.month, lastDay);
    });
    _loadReport();
  }

  Future<
      ({
        List<Map<String, dynamic>> categories,
        List<Map<String, dynamic>> entries
      })> _fetchCategoryTotals() async {
    final entries = <Map<String, dynamic>>[];
    var page = 1;
    var totalPages = 1;
    do {
      final result = await widget.financeRepo.fetchEntries(
        page: page,
        limit: 100,
        type: _reportType == 'all' ? null : _reportType,
        startDate: _reportStart,
        endDate: _reportEnd,
      );
      final data = result['data'];
      if (data is List) {
        entries.addAll(
          data.map((item) => Map<String, dynamic>.from(item as Map)),
        );
      }
      final meta = result['meta'];
      totalPages = meta is Map
          ? int.tryParse(meta['totalPages']?.toString() ?? '') ?? 1
          : 1;
      page++;
    } while (page <= totalPages);

    final groups = <String, Map<String, dynamic>>{};
    for (final entry in entries) {
      final category = entry['category'];
      final categoryMap =
          category is Map ? category : const <String, dynamic>{};
      final categoryId =
          categoryMap['_id']?.toString() ?? category?.toString() ?? 'general';
      final group = groups.putIfAbsent(
        categoryId,
        () => {
          'categoryName': categoryMap['name']?.toString() ?? 'General',
          'categoryIcon': categoryMap['icon']?.toString() ?? '📦',
          'categoryId': categoryId,
          'total': 0.0,
          'count': 0,
        },
      );
      final rawAmount = entry['amount'];
      final amount = rawAmount is num
          ? rawAmount.toDouble()
          : double.tryParse(rawAmount?.toString() ?? '') ?? 0;
      group['total'] = (group['total'] as double) + amount;
      group['count'] = (group['count'] as int) + 1;
    }

    final totals = groups.values.toList()
      ..sort((a, b) => (b['total'] as double).compareTo(a['total'] as double));
    return (categories: totals, entries: entries);
  }

  Future<void> _pickReportRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2015),
      lastDate: DateTime(DateTime.now().year + 5, 12, 31),
      initialDateRange: DateTimeRange(start: _reportStart, end: _reportEnd),
    );
    if (range == null || !mounted) return;
    setState(() {
      _reportStart =
          DateTime(range.start.year, range.start.month, range.start.day);
      _reportEnd = DateTime(range.end.year, range.end.month, range.end.day);
    });
    _loadReport();
  }

  String _dateLabel(DateTime date) => '${date.day}/${date.month}/${date.year}';

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;

    final income = (_summary['income'] as num?) ?? 0;
    final expense = (_summary['expense'] as num?) ?? 0;
    final savings = (_summary['savings'] as num?) ?? 0;
    final net = income - expense;
    final savingsRate =
        income > 0 ? ((savings / income) * 100).clamp(0, 100) : 0;
    final visibleCategories = _categories
        .where((category) =>
            _reportCategoryId == null ||
            category['categoryId'] == _reportCategoryId)
        .toList();
    final visibleEntries = _reportEntries.where((entry) {
      if (_reportCategoryId == null) return true;
      final category = entry['category'];
      final categoryId =
          category is Map ? category['_id']?.toString() : category?.toString();
      return categoryId == _reportCategoryId;
    }).toList();
    final categoryTotal = _categories.fold<double>(
      0,
      (sum, category) => sum + ((category['total'] as num?)?.toDouble() ?? 0),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('report_title'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
          children: [
            // ── Month Selector ───────────────────────────────────────
            // Center(
            //   child: MonthYearPicker(
            //     selectedDate: _selectedDate,
            //     onChanged: _onDateChanged,
            //   ),
            // ),
            // const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickReportRange,
              icon: const Icon(Icons.date_range_rounded),
              label: Text(
                '${loc.tr('date_range')}: ${_dateLabel(_reportStart)} – ${_dateLabel(_reportEnd)}',
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                for (final type in [
                  'all',
                  'income',
                  'expense',
                  'investment',
                  'savings',
                  'payable',
                  'receivable',
                ])
                  ChoiceChip(
                    label: Text(loc.tr('filter_$type')),
                    selected: _reportType == type,
                    onSelected: (_) {
                      if (_reportType == type) return;
                      setState(() {
                        _reportType = type;
                        _reportCategoryId = null;
                      });
                      _loadReport();
                    },
                  ),
              ],
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _reportCategoryId ?? '',
              decoration: InputDecoration(labelText: loc.tr('category')),
              items: [
                DropdownMenuItem(
                  value: '',
                  child: Text(loc.tr('all_categories')),
                ),
                ..._categories.map((category) => DropdownMenuItem(
                      value: category['categoryId']?.toString() ?? '',
                      child: Text(
                        '${category['categoryIcon'] ?? '📦'} ${category['categoryName'] ?? ''}',
                      ),
                    )),
              ],
              onChanged: (value) => setState(
                () => _reportCategoryId =
                    value == null || value.isEmpty ? null : value,
              ),
            ),
            const SizedBox(height: 18),

            if (_loading)
              const ShimmerLoading(count: 4)
            else if (_error != null)
              ErrorState(message: _error!, onRetry: _loadReport)
            else if (income == 0 &&
                expense == 0 &&
                savings == 0 &&
                _categories.isEmpty)
              EmptyState(
                icon: Icons.assessment_outlined,
                title: loc.tr('no_data_month'),
                subtitle: loc.tr('no_data_month_hint'),
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
                      loc.tr('net_savings'),
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
                          Text(
                            loc.tr('savings_rate'),
                            style: const TextStyle(
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
                      label: loc.tr('total_income'),
                      amount: _formatCurrency(income),
                      icon: Icons.arrow_downward_rounded,
                      color: AppColors.sage,
                      backgroundColor: AppColors.pastelIce.withAlpha(140),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatChip(
                      label: loc.tr('total_expense'),
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
              SectionHeader(title: loc.tr('spending_by_category')),
              if (visibleCategories.isEmpty)
                Text(
                  loc.tr('no_categorized_expenses'),
                  style: TextStyle(
                    color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                    fontSize: 13,
                  ),
                )
              else
                ...visibleCategories.map((cat) {
                  final catName = cat['categoryName']?.toString() ?? 'General';
                  final total = (cat['total'] as num?) ?? 0;
                  final count = (cat['count'] as int?) ?? 0;
                  final percentage = categoryTotal > 0
                      ? (total / categoryTotal).clamp(0.0, 1.0)
                      : 0.0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:
                          isDark ? AppColors.darkElevated : AppColors.paperCard,
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
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Text(
                                    cat['categoryIcon']?.toString() ?? '📦',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      catName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  _formatCurrency(total),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                    color: AppColors.terra,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '$count ${loc.tr('transactions')}',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isDark
                                        ? AppColors.darkMuted
                                        : AppColors.inkLight,
                                  ),
                                ),
                              ],
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
                            '${(percentage * 100).toStringAsFixed(1)}% ${loc.tr('of_expenses')}',
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
              const SizedBox(height: 10),
              SectionHeader(title: loc.tr('category_report_entries')),
              if (visibleEntries.isEmpty)
                Text(
                  loc.tr('no_entries_found'),
                  style: TextStyle(
                    color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                    fontSize: 13,
                  ),
                )
              else
                ...visibleEntries.map((entry) {
                  final category = entry['category'];
                  final categoryMap =
                      category is Map ? category : const <String, dynamic>{};
                  final amountRaw = entry['amount'];
                  final amount = amountRaw is num
                      ? amountRaw.toDouble()
                      : double.tryParse(amountRaw?.toString() ?? '') ?? 0;
                  final date = DateTime.tryParse(
                    entry['date']?.toString() ?? '',
                  );
                  final dateText = date == null
                      ? ''
                      : '${date.day}/${date.month}/${date.year}';
                  final title =
                      entry['note']?.toString().trim().isNotEmpty == true
                          ? entry['note'].toString()
                          : (categoryMap['name']?.toString() ?? 'General');
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    leading: CircleAvatar(
                      backgroundColor: AppColors.terra.withAlpha(20),
                      child: Text(
                        categoryMap['icon']?.toString() ?? '📦',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    title: Text(title,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(
                      '$dateText • ${loc.tr('filter_${entry['type'] ?? 'expense'}')}',
                    ),
                    trailing: Text(
                      _formatCurrency(amount),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: AppColors.terra,
                      ),
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
