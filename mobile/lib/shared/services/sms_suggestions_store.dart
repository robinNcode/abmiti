import 'dart:async';

import 'package:flutter/foundation.dart';

import 'sms_parser_service.dart';

/// Holds the bank/MFS transaction suggestions detected from SMS on this device.
///
/// The dashboard lists these for the user to either log as a ledger entry or
/// ignore. Only suggestions received on the current local day are surfaced;
/// anything older is pruned so the list always reflects today's activity.
class SmsSuggestionsStore extends ChangeNotifier {
  SmsSuggestionsStore._();

  static final SmsSuggestionsStore instance = SmsSuggestionsStore._();

  final SmsParserService _service = SmsParserService.instance;

  StreamSubscription<void>? _subscription;
  bool _initialized = false;
  List<Map<String, dynamic>> _suggestions = const [];

  List<Map<String, dynamic>> get suggestions => _suggestions;

  int get count => _suggestions.length;

  bool get isSupported => _service.isSupported;

  /// Subscribes to native SMS events and performs an initial load. Safe to call
  /// multiple times.
  Future<void> init() async {
    if (_initialized || !isSupported) return;
    _initialized = true;
    _subscription = _service.incomingCandidates.listen((_) => refresh());
    await refresh();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _subscription = null;
    _initialized = false;
    super.dispose();
  }

  /// Reloads today's suggestions from the native store, pruning stale entries.
  Future<void> refresh() async {
    if (!isSupported) return;
    try {
      final all = await _service.getPendingCandidates();
      final today = _todayOnly(all);
      final staleIds = all
          .where((item) => !today.any((t) => t['id'] == item['id']))
          .map((item) => item['id']?.toString())
          .whereType<String>()
          .toList();
      if (staleIds.isNotEmpty) {
        await _service.removeCandidates(staleIds);
      }
      _setSuggestions(today);
    } catch (_) {
      // Native channel unavailable — keep whatever we already have.
    }
  }

  Future<void> ignore(String id) async {
    _setSuggestions(
      _suggestions.where((item) => item['id']?.toString() != id).toList(),
    );
    await _service.removeCandidate(id);
  }

  Future<void> ignoreAll() async {
    final ids = _suggestions
        .map((item) => item['id']?.toString())
        .whereType<String>()
        .toList();
    _setSuggestions(const []);
    await _service.removeCandidates(ids);
  }

  /// Removes a suggestion once the user has logged it as a ledger entry.
  Future<void> markEntered(String id) => ignore(id);

  void _setSuggestions(List<Map<String, dynamic>> next) {
    _suggestions = next;
    notifyListeners();
  }

  List<Map<String, dynamic>> _todayOnly(List<Map<String, dynamic>> items) {
    final now = DateTime.now();
    return items.where((item) {
      final raw = item['receivedAt'];
      final millis = raw is num ? raw.toInt() : int.tryParse('$raw');
      if (millis == null || millis <= 0) return false;
      final date = DateTime.fromMillisecondsSinceEpoch(millis);
      return date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    }).toList();
  }
}
