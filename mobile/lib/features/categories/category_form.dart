import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';

/// Modal dialog for creating or updating a Category.
class CategoryFormDialog extends StatefulWidget {
  const CategoryFormDialog({
    super.key,
    required this.financeRepo,
    this.existingCategory,
    required this.onSaved,
  });

  final FinanceRepository financeRepo;
  final Map<String, dynamic>? existingCategory;
  final VoidCallback onSaved;

  static Future<void> show(
    BuildContext context, {
    required FinanceRepository financeRepo,
    Map<String, dynamic>? existingCategory,
    required VoidCallback onSaved,
  }) {
    return showDialog(
      context: context,
      builder: (ctx) => CategoryFormDialog(
        financeRepo: financeRepo,
        existingCategory: existingCategory,
        onSaved: onSaved,
      ),
    );
  }

  @override
  State<CategoryFormDialog> createState() => _CategoryFormDialogState();
}

class _CategoryFormDialogState extends State<CategoryFormDialog> {
  final _nameController = TextEditingController();
  String _type = 'expense';
  String _selectedColor = '#C2552A';
  String _selectedIcon = '🏷️';
  bool _submitting = false;
  String? _error;

  static const List<String> _colorOptions = [
    '#C2552A',
    '#4A7C59',
    '#D4973E',
    '#2B6CB0',
    '#805AD5',
    '#D53F8C',
    '#319795',
    '#DD6B20',
    '#718096',
    '#E53E3E'
  ];

  static const List<String> _emojiOptions = [
    '🏷️',
    '🛒',
    '🍔',
    '🏠',
    '🚗',
    '🏥',
    '💼',
    '🎁',
    '🎓',
    '✈️',
    '💰',
    '📈',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.existingCategory != null) {
      final c = widget.existingCategory!;
      _nameController.text = c['name']?.toString() ?? '';
      _type = c['type']?.toString() ?? 'expense';
      _selectedColor = c['color']?.toString() ?? '#C2552A';
      _selectedIcon = _normalizeIconValue(c['icon']?.toString());
    }
  }

  String _normalizeIconValue(String? value) {
    final safeValue = (value ?? '').trim();
    if (safeValue.isEmpty) return '🏷️';
    if (RegExp(r'[\u{1F300}-\u{1FAFF}]', unicode: true).hasMatch(safeValue)) {
      return safeValue;
    }

    const mapping = {
      'tag': '🏷️',
      'cart': '🛒',
      'food': '🍔',
      'home': '🏠',
      'car': '🚗',
      'medical': '🏥',
      'work': '💼',
      'gift': '🎁',
      'education': '🎓',
      'travel': '✈️',
      'money': '💰',
      'chart': '📈',
    };

    return mapping[safeValue] ?? '🏷️';
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Color _hexToColor(String hex) {
    final buffer = StringBuffer();
    if (hex.length == 6 || hex.length == 7) buffer.write('ff');
    buffer.write(hex.replaceFirst('#', ''));
    try {
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return AppColors.terra;
    }
  }

  Future<void> _submit() async {
    final loc = context.appLocale;
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = loc.tr('category_name_required'));
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final payload = {
        'name': name,
        'type': _type,
        'color': _selectedColor,
        'icon': _selectedIcon,
        'isDefault': false,
      };

      if (widget.existingCategory != null) {
        final id = widget.existingCategory!['_id'].toString();
        await widget.financeRepo.updateCategory(id, payload);
      } else {
        await widget.financeRepo.createCategory(payload);
      }

      if (mounted) {
        Navigator.pop(context);
        widget.onSaved();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = ApiClient.messageFrom(e);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEditing = widget.existingCategory != null;
    final loc = context.appLocale;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(
        isEditing ? loc.tr('edit_category') : loc.tr('new_category'),
        style: const TextStyle(fontWeight: FontWeight.w800),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: loc.tr('category_name'),
                hintText: loc.tr('category_name_hint'),
              ),
              autofocus: true,
            ),
            const SizedBox(height: 16),

            // Type selector
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: InputDecoration(labelText: loc.tr('category_type')),
              items: [
                DropdownMenuItem(
                    value: 'expense', child: Text(loc.tr('filter_expense'))),
                DropdownMenuItem(
                    value: 'income', child: Text(loc.tr('filter_income'))),
                DropdownMenuItem(
                    value: 'savings', child: Text(loc.tr('filter_savings'))),
                DropdownMenuItem(
                    value: 'payable', child: Text(loc.tr('filter_payable'))),
                DropdownMenuItem(
                    value: 'receivable',
                    child: Text(loc.tr('filter_receivable'))),
                DropdownMenuItem(
                    value: 'investment',
                    child: Text(loc.tr('filter_investment'))),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _type = val);
              },
            ),
            const SizedBox(height: 16),

            // Color Palette
            Text(
              loc.tr('color_tag'),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _colorOptions.map((cHex) {
                final c = _hexToColor(cHex);
                final isSelected =
                    _selectedColor.toLowerCase() == cHex.toLowerCase();
                return GestureDetector(
                  onTap: () => setState(() => _selectedColor = cHex),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: c,
                      shape: BoxShape.circle,
                      border: isSelected
                          ? Border.all(
                              color: isDark ? Colors.white : Colors.black87,
                              width: 2.5,
                            )
                          : null,
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Emoji Selector
            Text(
              loc.tr('icon'),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _emojiOptions.map((emoji) {
                final isSelected = _selectedIcon == emoji;
                return ChoiceChip(
                  label: Text(emoji, style: const TextStyle(fontSize: 18)),
                  selected: isSelected,
                  selectedColor: AppColors.terra.withAlpha(36),
                  onSelected: (_) => setState(() => _selectedIcon = emoji),
                );
              }).toList(),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: AppColors.danger, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(loc.tr('cancel')),
        ),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Text(isEditing ? loc.tr('save') : loc.tr('create')),
        ),
      ],
    );
  }
}
