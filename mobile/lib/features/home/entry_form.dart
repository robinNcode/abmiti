import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';

/// Modal bottom sheet form for adding a new transaction entry.
class EntryFormModal extends StatefulWidget {
  const EntryFormModal({
    super.key,
    required this.financeRepo,
    required this.onEntryCreated,
  });

  final FinanceRepository financeRepo;
  final VoidCallback onEntryCreated;

  static Future<void> show(
    BuildContext context, {
    required FinanceRepository financeRepo,
    required VoidCallback onEntryCreated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => EntryFormModal(
        financeRepo: financeRepo,
        onEntryCreated: onEntryCreated,
      ),
    );
  }

  @override
  State<EntryFormModal> createState() => _EntryFormModalState();
}

class _EntryFormModalState extends State<EntryFormModal> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();

  String _type = 'expense';
  String _source = 'cash';
  String? _selectedCategoryId;
  final DateTime _date = DateTime.now();
  bool _submitting = false;
  String? _errorMessage;

  List<Map<String, dynamic>> _categories = [];
  bool _loadingCategories = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final list = await widget.financeRepo.fetchCategories(type: _type);
      if (mounted) {
        setState(() {
          _categories = list;
          _selectedCategoryId = list.isNotEmpty ? list.first['_id']?.toString() : null;
          _loadingCategories = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingCategories = false);
    }
  }

  void _onTypeChanged(String newType) {
    if (_type == newType) return;
    setState(() {
      _type = newType;
      _loadingCategories = true;
      _selectedCategoryId = null;
    });
    _loadCategories();
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount <= 0) {
      setState(() => _errorMessage = 'Please enter a valid amount');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final payload = <String, dynamic>{
        'type': _type,
        'amount': amount,
        'source': _source,
        'date': _date.toIso8601String(),
        if (_noteController.text.trim().isNotEmpty)
          'note': _noteController.text.trim(),
        if (_selectedCategoryId != null) 'category': _selectedCategoryId,
      };

      await widget.financeRepo.createEntry(payload);
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
                  'New Entry',
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

            // Type Segment selector
            Row(
              children: [
                Expanded(
                  child: _TypeChip(
                    label: 'Expense',
                    icon: Icons.arrow_upward_rounded,
                    isSelected: _type == 'expense',
                    selectedColor: AppColors.terra,
                    onTap: () => _onTypeChanged('expense'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _TypeChip(
                    label: 'Income',
                    icon: Icons.arrow_downward_rounded,
                    isSelected: _type == 'income',
                    selectedColor: AppColors.sage,
                    onTap: () => _onTypeChanged('income'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _TypeChip(
                    label: 'Savings',
                    icon: Icons.savings_outlined,
                    isSelected: _type == 'savings',
                    selectedColor: AppColors.mustard,
                    onTap: () => _onTypeChanged('savings'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Amount Field
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              decoration: const InputDecoration(
                prefixText: '৳ ',
                prefixStyle: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.terra,
                ),
                hintText: '0.00',
                labelText: 'Amount',
              ),
            ),
            const SizedBox(height: 14),

            // Category Dropdown
            if (_loadingCategories)
              const LinearProgressIndicator(minHeight: 2)
            else if (_categories.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _selectedCategoryId,
                decoration: const InputDecoration(labelText: 'Category'),
                items: _categories.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['_id']?.toString(),
                    child: Text(c['name']?.toString() ?? 'Unnamed'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedCategoryId = val),
              ),
            const SizedBox(height: 14),

            // Source Selector
            DropdownButtonFormField<String>(
              initialValue: _source,
              decoration: const InputDecoration(labelText: 'Payment Source'),
              items: const [
                DropdownMenuItem(value: 'cash', child: Text('Cash')),
                DropdownMenuItem(value: 'bank', child: Text('Bank Transfer')),
                DropdownMenuItem(value: 'bkash', child: Text('bKash')),
                DropdownMenuItem(value: 'nagad', child: Text('Nagad')),
                DropdownMenuItem(value: 'card', child: Text('Card')),
                DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _source = val);
              },
            ),
            const SizedBox(height: 14),

            // Note
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: 'Note (Optional)',
                hintText: 'e.g. Grocery, Lunch, Rent',
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
                  : const Text('Add Entry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.selectedColor,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final Color selectedColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? selectedColor
              : (isDark ? AppColors.darkElevated : AppColors.pastelCream.withAlpha(150)),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? selectedColor
                : (isDark ? AppColors.darkBorder : AppColors.pastelApricot.withAlpha(120)),
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected
                  ? Colors.white
                  : (isDark ? Colors.white70 : AppColors.ink),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : AppColors.ink),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
