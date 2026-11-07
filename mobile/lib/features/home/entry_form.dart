import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/entry_types.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../categories/category_form.dart';

/// Modal bottom sheet form for adding or editing a transaction entry.
class EntryFormModal extends StatefulWidget {
  const EntryFormModal({
    super.key,
    required this.financeRepo,
    required this.onEntryCreated,
    this.entry,
    this.initialBudgetLineId,
    this.initialAmount,
    this.initialNote,
    this.initialCategoryId,
    this.initialType,
    this.initialDate,
  });

  final FinanceRepository financeRepo;
  final VoidCallback onEntryCreated;

  /// When set, the modal edits this existing entry instead of creating one.
  final Map<String, dynamic>? entry;
  final String? initialBudgetLineId;
  final num? initialAmount;
  final String? initialNote;
  final String? initialCategoryId;
  final String? initialType;
  final DateTime? initialDate;

  static Future<void> show(
    BuildContext context, {
    required FinanceRepository financeRepo,
    required VoidCallback onEntryCreated,
    Map<String, dynamic>? entry,
    String? initialBudgetLineId,
    num? initialAmount,
    String? initialNote,
    String? initialCategoryId,
    String? initialType,
    DateTime? initialDate,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => EntryFormModal(
        financeRepo: financeRepo,
        onEntryCreated: onEntryCreated,
        entry: entry,
        initialBudgetLineId: initialBudgetLineId,
        initialAmount: initialAmount,
        initialNote: initialNote,
        initialCategoryId: initialCategoryId,
        initialType: initialType,
        initialDate: initialDate,
      ),
    );
  }

  @override
  State<EntryFormModal> createState() => _EntryFormModalState();
}

class _EntryFormModalState extends State<EntryFormModal> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  final _sectorController = TextEditingController();

  late String _type;
  String _source = 'cash';
  String? _selectedCategoryId;
  String? _selectedBudgetLineId;
  String? _selectedAccountId;
  bool _showAllCategories = false;
  late DateTime _date;
  bool _submitting = false;
  String? _errorMessage;

  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _budgetLines = [];
  List<Map<String, dynamic>> _accounts = [];
  bool _loadingCategories = true;

  bool get _editing => widget.entry != null;

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;
    _type = entry?['type']?.toString() ?? widget.initialType ?? 'expense';
    _source = entry?['source']?.toString() ?? 'cash';
    _selectedBudgetLineId = widget.initialBudgetLineId;
    _selectedCategoryId = widget.initialCategoryId;
    _date = DateTime.tryParse(entry?['date']?.toString() ?? '') ??
        widget.initialDate ??
        DateTime.now();

    final rawCategory = entry?['category'];
    if (rawCategory is Map && rawCategory['_id'] != null) {
      _selectedCategoryId = rawCategory['_id'].toString();
    } else if (rawCategory is String && rawCategory.isNotEmpty) {
      _selectedCategoryId = rawCategory;
    }
    final rawAccount = entry?['account'];
    if (rawAccount is Map && rawAccount['_id'] != null) {
      _selectedAccountId = rawAccount['_id'].toString();
    } else if (rawAccount is String && rawAccount.isNotEmpty) {
      _selectedAccountId = rawAccount;
    }

    final amount = entry?['amount'];
    if (amount is num) {
      _amountController.text = amount.toString();
    }
    _noteController.text =
        entry?['note']?.toString() ?? widget.initialNote ?? '';
    _sectorController.text = entry?['sector']?.toString() ?? '';
    if (widget.initialAmount != null) {
      _amountController.text = widget.initialAmount.toString();
    }

    _loadCategories();
    _loadAccounts();
    _loadBudgetLines();
  }

  Map<String, dynamic>? get _selectedBudgetLine {
    for (final line in _budgetLines) {
      if (line['_id']?.toString() == _selectedBudgetLineId) return line;
    }
    return null;
  }

  Future<void> _loadAccounts() async {
    try {
      final accounts = await widget.financeRepo.fetchAccounts();
      if (mounted) setState(() => _accounts = accounts);
    } catch (e) {
      if (mounted) setState(() => _errorMessage = ApiClient.messageFrom(e));
    }
  }

  Future<void> _loadBudgetLines() async {
    if (_type != 'expense') return;
    try {
      final budget = await widget.financeRepo.fetchBudget(
        _date.month,
        _date.year,
      );
      if (!mounted) return;
      final lines = budget?['lines'];
      setState(() {
        _budgetLines = lines is List
            ? lines
                .whereType<Map>()
                .map((line) => Map<String, dynamic>.from(line))
                .where((line) => line['isActive'] != false)
                .toList()
            : [];
        if (_selectedBudgetLineId != null &&
            !_budgetLines.any(
              (line) => line['_id']?.toString() == _selectedBudgetLineId,
            )) {
          _selectedBudgetLineId = null;
        }
      });
    } catch (e) {
      if (mounted) setState(() => _errorMessage = ApiClient.messageFrom(e));
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    _sectorController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    if (mounted) setState(() => _loadingCategories = true);

    try {
      var list = await widget.financeRepo
          .fetchCategories(type: EntryTypes.categoryTypeOf(_type));
      if (list.isEmpty && _type != 'expense') {
        // Fall back to expense categories when a type has none seeded.
        list = await widget.financeRepo.fetchCategories(type: 'expense');
      }
      if (list.isEmpty) {
        // Fall back to all available categories if type-specific list is empty.
        list = await widget.financeRepo.fetchCategories();
      }

      if (!mounted) return;
      setState(() {
        _categories = list;
        final ids = _selectedBudgetLine?['linkedCategoryIds'];
        final hasLinked = ids is List && ids.isNotEmpty;
        final matchingLinked = hasLinked
            ? list
                .where((c) => ids.any(
                    (id) => id.toString() == c['_id']?.toString()))
                .toList()
            : <Map<String, dynamic>>[];

        if (_selectedCategoryId == null ||
            !list.any((c) => c['_id']?.toString() == _selectedCategoryId)) {
          if (matchingLinked.isNotEmpty) {
            _selectedCategoryId = matchingLinked.first['_id']?.toString();
          } else if (list.isNotEmpty) {
            _selectedCategoryId = list.first['_id']?.toString();
          } else {
            _selectedCategoryId = null;
          }
        }
        _loadingCategories = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingCategories = false);
    }
  }

  void _onTypeChanged(String newType) {
    if (_type == newType) return;
    setState(() {
      _type = newType;
      _selectedCategoryId = null;
      _selectedBudgetLineId = null;
    });
    _loadCategories();
    _loadBudgetLines();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2015, 1, 1),
      lastDate: DateTime(DateTime.now().year + 5, 12, 31),
    );
    if (picked != null && mounted) {
      setState(() => _date = DateTime(
            picked.year,
            picked.month,
            picked.day,
            _date.hour,
            _date.minute,
          ));
      _loadBudgetLines();
    }
  }

  String get _formattedDate {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${_date.day} ${months[_date.month - 1]} ${_date.year}';
  }

  Widget _categoryIconWidget(String? value, {double size = 16}) {
    final safeValue = (value ?? '').trim();
    if (safeValue.isEmpty) {
      return const Icon(Icons.label_rounded, size: 16, color: AppColors.terra);
    }

    if (RegExp(r'[\u{1F300}-\u{1FAFF}]', unicode: true).hasMatch(safeValue)) {
      return Text(safeValue, style: TextStyle(fontSize: size));
    }

    final iconMap = {
      'tag': Icons.local_offer_rounded,
      'cart': Icons.shopping_cart_rounded,
      'food': Icons.restaurant_rounded,
      'home': Icons.home_rounded,
      'car': Icons.directions_car_rounded,
      'medical': Icons.medical_services_rounded,
      'work': Icons.work_rounded,
      'gift': Icons.card_giftcard_rounded,
      'education': Icons.school_rounded,
      'travel': Icons.flight_rounded,
      'money': Icons.attach_money_rounded,
      'chart': Icons.bar_chart_rounded,
    };

    return Icon(iconMap[safeValue] ?? Icons.label_rounded,
        size: size, color: AppColors.terra);
  }

  Future<void> _submit() async {
    final loc = context.appLocale;
    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount <= 0) {
      setState(() => _errorMessage = loc.tr('amount_invalid'));
      return;
    }
    if (_selectedCategoryId == null && _categories.isNotEmpty) {
      _selectedCategoryId = _categories.first['_id']?.toString();
    }
    if (_selectedCategoryId == null) {
      setState(() => _errorMessage = loc.tr('category_required'));
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    final note = _noteController.text.trim();

    try {
      final payload = <String, dynamic>{
        'amount': amount,
        'categoryId': _selectedCategoryId,
        'source': _source,
        'date': _date.toIso8601String(),
        'note': note,
        'sector': _sectorController.text.trim(),
        'accountId': _selectedAccountId,
        if (!_editing) 'type': _type,
      };

      if (_editing) {
        await widget.financeRepo
            .updateEntry(widget.entry!['_id'].toString(), payload);
      } else {
        await widget.financeRepo.createEntry(payload);
      }

      if (mounted) {
        Navigator.pop(context);
        widget.onEntryCreated();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _errorMessage = ApiClient.messageFrom(e);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final media = MediaQuery.of(context);
    final loc = context.appLocale;

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: media.size.height * 0.88,
      ),
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 16, 20, media.viewInsets.bottom + 24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.paper,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: ListView(
          padding: EdgeInsets.zero,
          shrinkWrap: true,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _editing ? loc.tr('edit_entry') : loc.tr('new_entry_title'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 14),

            _TypeGrid(
              selected: _type,
              enabled: !_editing,
              onSelected: _onTypeChanged,
            ),
            if (_editing) ...[
              const SizedBox(height: 8),
              Text(
                loc.tr('entry_type_fixed'),
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                ),
              ),
            ],
            const SizedBox(height: 18),

            if (!_editing && _type == 'expense' && _budgetLines.isNotEmpty) ...[
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  loc.tr('budget_line'),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ChoiceChip(
                    label: Text(loc.tr('all')),
                    selected: _selectedBudgetLineId == null,
                    onSelected: (_) =>
                        setState(() => _selectedBudgetLineId = null),
                  ),
                  ..._budgetLines.map((line) {
                    final id = line['_id']?.toString();
                    return ChoiceChip(
                      label: Text('${line['icon'] ?? '📦'} ${line['name'] ?? ''}'),
                      selected: id == _selectedBudgetLineId,
                      onSelected: (_) {
                        final linkedIds = line['linkedCategoryIds'];
                        setState(() {
                          _selectedBudgetLineId = id;
                          _showAllCategories = false;
                          if (linkedIds is List && linkedIds.isNotEmpty) {
                            final matching = _categories.where(
                              (c) => linkedIds.any((lid) => lid.toString() == c['_id']?.toString()),
                            );
                            if (matching.isNotEmpty) {
                              _selectedCategoryId = matching.first['_id']?.toString();
                            }
                          }
                        });
                      },
                    );
                  }),
                ],
              ),
              if ((_selectedBudgetLine?['subItems'] as List?)?.isNotEmpty ?? false) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    loc.tr('budget_sub_items'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: ((_selectedBudgetLine!['subItems'] as List)
                          .whereType<Map>())
                      .map((rawSubItem) {
                    final subItem = Map<String, dynamic>.from(rawSubItem);
                    final name = subItem['name']?.toString() ?? '';
                    final expectedAmount = subItem['expectedAmount'];
                    return ActionChip(
                      label: Text(
                        expectedAmount is num && expectedAmount > 0
                            ? '$name (৳${expectedAmount.toStringAsFixed(0)})'
                            : name,
                      ),
                      onPressed: () {
                        setState(() {
                          _noteController.text = name;
                          if (expectedAmount is num && expectedAmount > 0) {
                            _amountController.text = expectedAmount.toString();
                          }
                          final linkedIds = _selectedBudgetLine?['linkedCategoryIds'];
                          if (linkedIds is List && linkedIds.isNotEmpty) {
                            final matching = _categories.where(
                              (c) => linkedIds.any((lid) => lid.toString() == c['_id']?.toString()),
                            );
                            if (matching.isNotEmpty) {
                              _selectedCategoryId = matching.first['_id']?.toString();
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ],
              if (_selectedBudgetLine != null &&
                  ((_selectedBudgetLine!['linkedCategoryIds'] as List?)?.isEmpty ?? true))
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                          loc.tr('budget_line_no_category_guide'),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : AppColors.inkLight,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 12),
            ],

            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: !_editing,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              decoration: InputDecoration(
                prefixText: '৳ ',
                prefixStyle: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.terra,
                ),
                hintText: '0.00',
                labelText: loc.tr('amount'),
              ),
            ),
            const SizedBox(height: 14),

            if (_loadingCategories)
              const LinearProgressIndicator(minHeight: 2)
            else if (_categories.isNotEmpty) ...[
              Builder(builder: (context) {
                final linkedIds = _selectedBudgetLine?['linkedCategoryIds'];
                final hasLinkedIds = linkedIds is List && linkedIds.isNotEmpty;
                final lineCategories = hasLinkedIds
                    ? _categories
                        .where((c) => linkedIds.any(
                            (id) => id.toString() == c['_id']?.toString()))
                        .toList()
                    : _categories;
                final displayCategories = (_showAllCategories || !hasLinkedIds || lineCategories.isEmpty)
                    ? _categories
                    : lineCategories;

                final effectiveValue = displayCategories.any(
                        (c) => c['_id']?.toString() == _selectedCategoryId)
                    ? _selectedCategoryId
                    : (displayCategories.isNotEmpty
                        ? displayCategories.first['_id']?.toString()
                        : null);

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (hasLinkedIds && lineCategories.isNotEmpty)
                          TextButton(
                            onPressed: () =>
                                setState(() => _showAllCategories = !_showAllCategories),
                            child: Text(
                              _showAllCategories
                                  ? loc.tr('show_line_categories')
                                  : loc.tr('show_all_categories'),
                            ),
                          )
                        else
                          const SizedBox.shrink(),
                        TextButton.icon(
                          icon: const Icon(Icons.add, size: 16),
                          label: Text(loc.tr('create_category')),
                          onPressed: () {
                            CategoryFormDialog.show(
                              context,
                              financeRepo: widget.financeRepo,
                              existingCategory: {'type': EntryTypes.categoryTypeOf(_type)},
                              onSaved: _loadCategories,
                            );
                          },
                        ),
                      ],
                    ),
                    DropdownButtonFormField<String>(
                      initialValue: effectiveValue,
                      decoration: InputDecoration(labelText: loc.tr('category')),
                      items: displayCategories
                          .map((c) => DropdownMenuItem<String>(
                                value: c['_id']?.toString(),
                                child: Row(
                                  children: [
                                    _categoryIconWidget(c['icon']?.toString()),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(c['name']?.toString() ?? 'Unnamed'),
                                    ),
                                  ],
                                ),
                              ))
                          .toList(),
                      onChanged: (val) => setState(() => _selectedCategoryId = val),
                    ),
                  ],
                );
              }),
            ] else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    loc.tr('no_categories_for_type'),
                    style: const TextStyle(fontSize: 13, color: AppColors.danger),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: Text(loc.tr('seed_default_categories')),
                        onPressed: () async {
                          setState(() => _loadingCategories = true);
                          try {
                            await widget.financeRepo.seedDefaultCategories();
                          } catch (_) {}
                          await _loadCategories();
                        },
                      ),
                      FilledButton.icon(
                        icon: const Icon(Icons.add, size: 16),
                        label: Text(loc.tr('create_category')),
                        onPressed: () {
                          CategoryFormDialog.show(
                            context,
                            financeRepo: widget.financeRepo,
                            existingCategory: {'type': EntryTypes.categoryTypeOf(_type)},
                            onSaved: _loadCategories,
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            const SizedBox(height: 14),

            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(14),
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: loc.tr('date'),
                  suffixIcon: const Icon(Icons.calendar_today_rounded, size: 18),
                ),
                child: Text(
                  _formattedDate,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            DropdownButtonFormField<String>(
              initialValue: _source,
              decoration: InputDecoration(labelText: loc.tr('payment_source')),
              items: [
                DropdownMenuItem(value: 'cash', child: Text(loc.tr('source_cash'))),
                DropdownMenuItem(value: 'bank', child: Text(loc.tr('source_bank'))),
                DropdownMenuItem(value: 'bkash', child: Text(loc.tr('source_bkash'))),
                DropdownMenuItem(value: 'nagad', child: Text(loc.tr('source_nagad'))),
                DropdownMenuItem(value: 'card', child: Text(loc.tr('source_card'))),
                DropdownMenuItem(value: 'other', child: Text(loc.tr('source_other'))),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _source = val);
              },
            ),
            const SizedBox(height: 14),

            if (_accounts.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _accounts.any(
                  (account) => account['_id']?.toString() == _selectedAccountId,
                )
                    ? _selectedAccountId
                    : null,
                decoration: InputDecoration(
                  labelText: loc.tr('account_optional'),
                ),
                items: [
                  DropdownMenuItem<String>(
                    value: null,
                    child: Text(loc.tr('no_account')),
                  ),
                  ..._accounts.map((account) => DropdownMenuItem<String>(
                        value: account['_id']?.toString(),
                        child: Text(account['name']?.toString() ?? ''),
                      )),
                ],
                onChanged: (value) => setState(() => _selectedAccountId = value),
              ),
            if (_accounts.isNotEmpty) const SizedBox(height: 14),

            TextField(
              controller: _sectorController,
              maxLength: 120,
              decoration: InputDecoration(
                counterText: '',
                labelText: loc.tr('sector_optional'),
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _noteController,
              maxLength: 300,
              decoration: InputDecoration(
                counterText: '',
                labelText: loc.tr('note_optional'),
                hintText: loc.tr('note_hint'),
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                style: const TextStyle(color: AppColors.danger, fontSize: 13),
              ),
            ],

            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      _editing ? loc.tr('save_changes') : loc.tr('add_entry'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Grid of the six supported entry types.
class _TypeGrid extends StatelessWidget {
  const _TypeGrid({
    required this.selected,
    required this.enabled,
    required this.onSelected,
  });

  final String selected;
  final bool enabled;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 8.0;
        final width = (constraints.maxWidth - gap * 2) / 3;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: EntryTypes.all.map((type) {
            final color = EntryTypes.colorOf(type);
            final isSelected = type == selected;
            final isDark = Theme.of(context).brightness == Brightness.dark;

            return SizedBox(
              width: width,
              child: InkWell(
                onTap: enabled ? () => onSelected(type) : null,
                borderRadius: BorderRadius.circular(14),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? color
                        : (isDark
                            ? AppColors.darkElevated
                            : AppColors.pastelCream.withAlpha(150)),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? color
                          : (isDark
                              ? AppColors.darkBorder
                              : AppColors.pastelApricot.withAlpha(120)),
                    ),
                  ),
                  child: Opacity(
                    opacity: enabled ? 1 : (isSelected ? 1 : 0.45),
                    child: Column(
                      children: [
                        Icon(
                          EntryTypes.iconOf(type),
                          size: 18,
                          color: isSelected
                              ? Colors.white
                              : (isDark
                                  ? Colors.white70
                                  : EntryTypes.colorOf(type)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          loc.tr('filter_$type'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? Colors.white
                                : (isDark ? Colors.white70 : AppColors.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
