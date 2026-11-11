import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/services/sms_suggestions_store.dart';
import '../../shared/widgets/empty_state.dart';
import 'sms_suggestion_tile.dart';

/// Dedicated screen listing every SMS-detected transaction grouped by date.
///
/// Each item can be logged as a ledger entry or ignored, mirroring the
/// dashboard section but with the full retained history instead of today only.
class SmsEntryScreen extends StatefulWidget {
  const SmsEntryScreen({super.key, required this.financeRepo});

  final FinanceRepository financeRepo;

  @override
  State<SmsEntryScreen> createState() => _SmsEntryScreenState();
}

class _SmsEntryScreenState extends State<SmsEntryScreen> {
  final SmsSuggestionsStore _store = SmsSuggestionsStore.instance;

  @override
  void initState() {
    super.initState();
    _store.refresh();
  }

  Future<void> _ignoreAll(BuildContext context) async {
    final loc = context.appLocale;
    final messenger = ScaffoldMessenger.of(context);
    await _store.ignoreAll();
    messenger.showSnackBar(
      SnackBar(content: Text(loc.tr('sms_entry_ignored_all'))),
    );
  }

  String _dayLabel(AppLocale loc, DateTime day) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final diff = today.difference(day).inDays;
    if (diff == 0) return loc.tr('sms_entry_today');
    if (diff == 1) return loc.tr('sms_entry_yesterday');
    return '${day.day} ${loc.monthShort(day.month)} ${day.year}';
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('sms_entry_title'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
        ),
        actions: [
          ListenableBuilder(
            listenable: _store,
            builder: (context, _) {
              if (_store.count == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => _ignoreAll(context),
                child: Text(loc.tr('sms_entry_ignore_all')),
              );
            },
          ),
        ],
      ),
      body: !_store.isSupported
          ? EmptyState(
              icon: Icons.phonelink_erase_rounded,
              title: loc.tr('sms_entry_unsupported'),
            )
          : ListenableBuilder(
              listenable: _store,
              builder: (context, _) {
                final groups = _store.groupedByDay();
                if (groups.isEmpty) {
                  return EmptyState(
                    icon: Icons.sms_outlined,
                    title: loc.tr('sms_entry_empty_title'),
                    subtitle: loc.tr('sms_entry_empty_hint'),
                  );
                }

                final days = groups.keys.toList()
                  ..sort((a, b) => b.compareTo(a));
                final isDark =
                    Theme.of(context).brightness == Brightness.dark;

                return ListView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  children: [
                    Text(
                      loc.tr('sms_entry_hint'),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkMuted
                            : AppColors.inkLight,
                      ),
                    ),
                    const SizedBox(height: 8),
                    for (final day in days) ...[
                      _DateHeader(label: _dayLabel(loc, day)),
                      ...groups[day]!.map(
                        (item) => SmsSuggestionTile(
                          item: item,
                          financeRepo: widget.financeRepo,
                          onEntryCreated: () {},
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
    );
  }
}

class _DateHeader extends StatelessWidget {
  const _DateHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 10),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AppColors.terra,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
              color: isDark ? Colors.white70 : AppColors.ink,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Divider(
              color: isDark ? AppColors.darkBorder : AppColors.paperMist,
            ),
          ),
        ],
      ),
    );
  }
}
