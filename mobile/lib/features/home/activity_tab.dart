import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/entry_types.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/shimmer_loading.dart';
import 'entry_form.dart';

/// Full-featured transaction ledger with filtering, pagination, and deletion.
class ActivityTab extends StatefulWidget {
  const ActivityTab({
    super.key,
    required this.financeRepo,
  });

  final FinanceRepository financeRepo;

  @override
  State<ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends State<ActivityTab> {
  final List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  int _page = 1;
  int _totalPages = 1;
  String _selectedFilter = 'all';

  final ScrollController _scrollController = ScrollController();

  final List<Map<String, String>> _filterOptions = const [
    {'key': 'all', 'label': 'All'},
    {'key': 'expense', 'label': 'Expense'},
    {'key': 'income', 'label': 'Income'},
    {'key': 'savings', 'label': 'Savings'},
    {'key': 'investment', 'label': 'Investment'},
    {'key': 'payable', 'label': 'Payable'},
    {'key': 'receivable', 'label': 'Receivable'},
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadEntries(refresh: true);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_loadingMore &&
        _page < _totalPages) {
      _loadMore();
    }
  }

  Future<void> _loadEntries({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _page = 1;
        _loading = true;
        _error = null;
      });
    }

    try {
      final response = await widget.financeRepo.fetchEntries(
        page: _page,
        limit: 20,
        type: _selectedFilter == 'all' ? null : _selectedFilter,
      );

      final items = response['data'] is List
          ? (response['data'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList()
          : <Map<String, dynamic>>[];

      final meta = response['meta'] is Map ? response['meta'] : null;
      final total = meta != null && meta['totalPages'] is int
          ? meta['totalPages'] as int
          : 1;

      if (mounted) {
        setState(() {
          if (refresh) {
            _entries.clear();
          }
          _entries.addAll(items);
          _totalPages = total;
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

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    _page++;
    try {
      final response = await widget.financeRepo.fetchEntries(
        page: _page,
        limit: 20,
        type: _selectedFilter == 'all' ? null : _selectedFilter,
      );
      final items = response['data'] is List
          ? (response['data'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList()
          : <Map<String, dynamic>>[];

      if (mounted) {
        setState(() {
          _entries.addAll(items);
          _loadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _deleteEntry(String id, int index) async {
    final loc = context.appLocale;
    final removed = _entries[index];
    setState(() {
      _entries.removeAt(index);
    });

    try {
      await widget.financeRepo.deleteEntry(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(loc.tr('transaction_deleted'))),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _entries.insert(index, removed);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    }
  }

  Future<void> _editEntry(Map<String, dynamic> entry) async {
    await EntryFormModal.show(
      context,
      financeRepo: widget.financeRepo,
      entry: entry,
      onEntryCreated: () => _loadEntries(refresh: true),
    );
  }

  void _onFilterSelected(String key) {
    if (_selectedFilter == key) return;
    setState(() {
      _selectedFilter = key;
    });
    _loadEntries(refresh: true);
  }

  String _formatCurrency(num value) {
    return '৳${value.toStringAsFixed(0)}';
  }

  String _formatDate(String? raw) {
    if (raw == null) return '';
    try {
      final dt = DateTime.parse(raw);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;

    return Scaffold(
      body: Column(
        children: [
          // ── Filter Horizontal Chips ────────────────────────────────
          Container(
            height: 52,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: _filterOptions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final opt = _filterOptions[index];
                final isSelected = _selectedFilter == opt['key'];
                return ChoiceChip(
                  label: Text(loc.tr('filter_${opt['key']}')),
                  selected: isSelected,
                  selectedColor: AppColors.terra,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? Colors.white
                        : (isDark ? Colors.white70 : AppColors.ink),
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 12,
                  ),
                  backgroundColor: isDark
                      ? AppColors.darkElevated
                      : AppColors.pastelCream.withAlpha(150),
                  side: BorderSide(
                    color: isSelected
                        ? AppColors.terra
                        : (isDark
                            ? AppColors.darkBorder
                            : AppColors.pastelApricot.withAlpha(120)),
                  ),
                  onSelected: (_) => _onFilterSelected(opt['key']!),
                );
              },
            ),
          ),

          // ── Entries List ───────────────────────────────────────────
          Expanded(
            child: _loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(20),
                    child: ShimmerLoading(count: 6),
                  )
                : _error != null
                    ? ErrorState(
                        message: _error!,
                        onRetry: () => _loadEntries(refresh: true),
                      )
                    : _entries.isEmpty
                        ? EmptyState(
                            icon: Icons.receipt_long_rounded,
                            title: loc.tr('no_entries_found'),
                            subtitle: loc.tr('no_entries_hint'),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _loadEntries(refresh: true),
                            child: ListView.builder(
                              controller: _scrollController,
                              padding:
                                  const EdgeInsets.fromLTRB(20, 10, 20, 80),
                              itemCount:
                                  _entries.length + (_loadingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index >= _entries.length) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 16),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    ),
                                  );
                                }

                                final e = _entries[index];
                                final id = e['_id']?.toString() ?? '';
                                final type = e['type']?.toString() ?? 'expense';
                                final typeColor = EntryTypes.colorOf(type);
                                final isCredit = EntryTypes.isCredit(type);
                                final amount = (e['amount'] as num?) ?? 0;
                                final note = e['note']?.toString();
                                final cat = e['category'] is Map
                                    ? e['category']['name']
                                    : null;
                                final source =
                                    e['source']?.toString() ?? 'cash';
                                final dateStr =
                                    _formatDate(e['date']?.toString());
                                final title = (note != null && note.isNotEmpty)
                                    ? note
                                    : (cat ?? loc.tr('filter_$type'));

                                return Dismissible(
                                  key: Key(id.isNotEmpty ? id : '$index'),
                                  direction: DismissDirection.endToStart,
                                  background: Container(
                                    alignment: Alignment.centerRight,
                                    padding: const EdgeInsets.only(right: 20),
                                    margin: const EdgeInsets.only(bottom: 10),
                                    decoration: BoxDecoration(
                                      color: AppColors.danger,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Icon(
                                      Icons.delete_outline_rounded,
                                      color: Colors.white,
                                    ),
                                  ),
                                  onDismissed: (_) => _deleteEntry(id, index),
                                  child: InkWell(
                                    onTap: () => _editEntry(e),
                                    borderRadius: BorderRadius.circular(16),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? AppColors.darkElevated
                                            : AppColors.paperCard,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: isDark
                                              ? AppColors.darkBorder
                                              : AppColors.paperMist,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: typeColor.withAlpha(25),
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Icon(
                                              EntryTypes.iconOf(type),
                                              color: typeColor,
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  title,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                const SizedBox(height: 3),
                                                Row(
                                                  children: [
                                                    Text(
                                                      dateStr,
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        color: isDark
                                                            ? AppColors
                                                                .darkMuted
                                                            : AppColors
                                                                .inkLight,
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets
                                                          .symmetric(
                                                          horizontal: 6,
                                                          vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: isDark
                                                            ? Colors.white10
                                                            : AppColors
                                                                .paperMist,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(6),
                                                      ),
                                                      child: Text(
                                                        source.toUpperCase(),
                                                        style: TextStyle(
                                                          fontSize: 9,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: isDark
                                                              ? AppColors
                                                                  .darkMuted
                                                              : AppColors
                                                                  .inkLight,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            '${isCredit ? '+' : '-'}${_formatCurrency(amount)}',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              color: typeColor,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          EntryFormModal.show(
            context,
            financeRepo: widget.financeRepo,
            onEntryCreated: () => _loadEntries(refresh: true),
          );
        },
        child: const Icon(Icons.add_rounded),
      ),
    );
  }
}
