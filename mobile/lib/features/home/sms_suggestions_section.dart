import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/entry_types.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/services/sms_suggestions_store.dart';
import '../../shared/widgets/section_header.dart';
import 'entry_form.dart';

/// Dashboard section listing the transactions detected from SMS today.
///
/// Each suggestion can be logged as a ledger entry or ignored. Nothing is
/// removed until the user acts, so the list is stable across refreshes.
class SmsSuggestionsSection extends StatelessWidget {
  const SmsSuggestionsSection({
    super.key,
    required this.financeRepo,
    required this.onEntryCreated,
  });

  final FinanceRepository financeRepo;
  final VoidCallback onEntryCreated;

  @override
  Widget build(BuildContext context) {
    final store = SmsSuggestionsStore.instance;
    if (!store.isSupported) return const SizedBox.shrink();

    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final suggestions = store.suggestions;
        if (suggestions.isEmpty) return const SizedBox.shrink();
        final loc = context.appLocale;

        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SectionHeader(
                title: loc.tr('sms_suggestions_title'),
                action: suggestions.length > 1
                    ? loc.tr('sms_suggestions_ignore_all')
                    : null,
                onAction: suggestions.length > 1 ? store.ignoreAll : null,
              ),
              Text(
                loc.tr('sms_suggestions_hint'),
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkMuted
                      : AppColors.inkLight,
                ),
              ),
              const SizedBox(height: 12),
              ...suggestions.map(
                (item) => _SmsSuggestionTile(
                  item: item,
                  financeRepo: financeRepo,
                  onEntryCreated: onEntryCreated,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SmsSuggestionTile extends StatelessWidget {
  const _SmsSuggestionTile({
    required this.item,
    required this.financeRepo,
    required this.onEntryCreated,
  });

  final Map<String, dynamic> item;
  final FinanceRepository financeRepo;
  final VoidCallback onEntryCreated;

  String get _id => item['id']?.toString() ?? '';

  String get _type => item['type']?.toString() ?? 'expense';

  num? get _amount {
    final raw = item['amount'];
    if (raw is num) return raw;
    return num.tryParse('$raw');
  }

  DateTime get _receivedAt {
    final raw = item['receivedAt'];
    final millis = raw is num ? raw.toInt() : int.tryParse('$raw');
    if (millis == null || millis <= 0) return DateTime.now();
    return DateTime.fromMillisecondsSinceEpoch(millis);
  }

  String get _time {
    final at = _receivedAt;
    final hh = at.hour.toString().padLeft(2, '0');
    final mm = at.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  String _formatCurrency(num value) => '৳${value.toStringAsFixed(2)}';

  Future<void> _openEntry(BuildContext context) async {
    final store = SmsSuggestionsStore.instance;
    final id = _id;
    await EntryFormModal.show(
      context,
      financeRepo: financeRepo,
      onEntryCreated: () {
        if (id.isNotEmpty) store.markEntered(id);
        onEntryCreated();
      },
      initialAmount: _amount,
      initialNote: item['note']?.toString(),
      initialType: _type,
      initialDate: _receivedAt,
    );
  }

  Future<void> _ignore(BuildContext context) async {
    final loc = context.appLocale;
    final messenger = ScaffoldMessenger.of(context);
    await SmsSuggestionsStore.instance.ignore(_id);
    messenger.showSnackBar(
      SnackBar(content: Text(loc.tr('sms_suggestions_ignored'))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final typeColor = EntryTypes.colorOf(_type);
    final provider = item['provider']?.toString() ?? '';
    final amount = _amount;
    final isCredit = EntryTypes.isCredit(_type);
    final sign = isCredit ? '+' : (_type == 'expense' ? '-' : '');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkElevated : AppColors.paperCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: typeColor.withAlpha(isDark ? 90 : 60),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: typeColor.withAlpha(28),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  EntryTypes.iconOf(_type),
                  color: typeColor,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      provider.isEmpty
                          ? loc.tr('sms_suggestions_title')
                          : provider,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${loc.tr('filter_$_type')} • $_time',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark
                            ? AppColors.darkMuted
                            : AppColors.inkLight,
                      ),
                    ),
                  ],
                ),
              ),
              if (amount != null)
                Text(
                  '$sign${_formatCurrency(amount)}',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: typeColor,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => _ignore(context),
                style: TextButton.styleFrom(
                  minimumSize: Size.zero,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(loc.tr('sms_suggestions_ignore')),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () => _openEntry(context),
                style: FilledButton.styleFrom(
                  minimumSize: Size.zero,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(loc.tr('sms_suggestions_entry')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
