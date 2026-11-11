import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/services/sms_suggestions_store.dart';
import '../../shared/widgets/section_header.dart';
import 'sms_suggestion_tile.dart';

/// Dashboard section listing the transactions detected from SMS today.
///
/// Each suggestion can be logged as a ledger entry or ignored. Nothing is
/// removed until the user acts, so the list is stable across refreshes. The
/// full date-wise history lives in the SMS Entry screen.
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
        final suggestions = store.todaySuggestions;
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
                onAction:
                    suggestions.length > 1 ? store.ignoreAllToday : null,
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
                (item) => SmsSuggestionTile(
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
