import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/entry_types.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';

/// Modal bottom sheet form for adding or editing a transaction entry.
class EntryFormModal extends StatefulWidget {
  const EntryFormModal({
    super.key,
    required this.financeRepo,
    required this.onEntryCreated,
    this.entry,
  });

  final FinanceRepository financeRepo;
  final VoidCallback onEntryCreated;

  /// When set, the modal edits this existing entry instead of creating one.
  final Map<String, dynamic>? entry;

  static Future<void> show(
    BuildContext context, {
    required FinanceRepository financeRepo,
    required VoidCallback onEntryCreated,
    Map<String, dynamic>? entry,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => EntryFormModal(
        financeRepo: financeRepo,
        onEntryCreated: onEntryCreated,
        entry: entry,
      ),
    );
  }

  @override
  State<EntryFormModal> createState() => _EntryFormModalState();
}

class _EntryFormModalState extends State<EntryFormModal> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();

  late String _type;
  String _source = 'cash';
  String? _selectedCategoryId;
  late DateTime _date;
  bool _submitting = false;
  String? _errorMessage;

  List<Map<String, dynamic>> _categories = [];
  bool _loadingCategories = true;

  bool get _editing => widget.entry != null;

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;
    _type = entry?['type']?.toString() ?? 'expense';
    _source = entry?['source']?.toString() ?? 'cash';
    _date =
        DateTime.tryParse(entry?['date']?.toString() ?? '') ?? DateTime.now();

    final rawCategory = entry?['category'];
    if (rawCategory is Map && rawCategory['_id'] != null) {
      _selectedCategoryId = rawCategory['_id'].toString();
    } else if (rawCategory is String && rawCategory.isNotEmpty) {
      _selectedCategoryId = rawCategory;
    }

    final amount = entry?['amount'];
    if (amount is num) {
      _amountController.text = amount.toString();
    }
    _noteController.text = entry?['note']?.toString() ?? '';

    _loadCategories();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
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

      if (!mounted) return;
      setState(() {
        _categories = list;
        if (_selectedCategoryId == null ||
            !list.any((c) => c['_id']?.toString() == _selectedCategoryId)) {
          _selectedCategoryId =
              list.isNotEmpty ? list.first['_id']?.toString() : null;
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
    });
    _loadCategories();
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

  Future<void> _submit() async {
    final loc = context.appLocale;
    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount <= 0) {
      setState(() => _errorMessage = loc.tr('amount_invalid'));
      return;
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

    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, media.viewInsets.bottom + 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.paper,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
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

            // ── Type selector (create) / read-only type (edit) ───────
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

            // Amount Field
            TextField(
              controller: _amountController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
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

            // Category Dropdown
            if (_loadingCategories)
              const LinearProgressIndicator(minHeight: 2)
            else if (_categories.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _selectedCategoryId,
                decoration: InputDecoration(labelText: loc.tr('category')),
                items: _categories.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['_id']?.toString(),
                    child: Text(
                      '${c['icon'] != null ? '${c['icon']} ' : ''}${c['name'] ?? 'Unnamed'}',
                    ),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedCategoryId = val),
              )
            else
              Text(
                loc.tr('no_categories_for_type'),
                style: const TextStyle(fontSize: 13, color: AppColors.danger),
              ),
            const SizedBox(height: 14),

            // Date picker
            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(14),
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: loc.tr('date'),
                  suffixIcon:
                      const Icon(Icons.calendar_today_rounded, size: 18),
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

            // Source Selector
            DropdownButtonFormField<String>(
              initialValue: _source,
              decoration: InputDecoration(labelText: loc.tr('payment_source')),
              items: [
                DropdownMenuItem(
                    value: 'cash', child: Text(loc.tr('source_cash'))),
                DropdownMenuItem(
                    value: 'bank', child: Text(loc.tr('source_bank'))),
                DropdownMenuItem(
                    value: 'bkash', child: Text(loc.tr('source_bkash'))),
                DropdownMenuItem(
                    value: 'nagad', child: Text(loc.tr('source_nagad'))),
                DropdownMenuItem(
                    value: 'card', child: Text(loc.tr('source_card'))),
                DropdownMenuItem(
                    value: 'other', child: Text(loc.tr('source_other'))),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _source = val);
              },
            ),
            const SizedBox(height: 14),

            // Note
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
