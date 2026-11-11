import 'dart:async';

import 'package:flutter/foundation.dart';

import 'sms_parser_service.dart';

/// Holds the bank/MFS transaction suggestions detected from SMS on this device.
///
/// The native store keeps a rolling window of detections (see
/// `SmsParserStore`). Suggestions are surfaced in two ways:
///  * the dashboard shows only [todaySuggestions], and
///  * the SMS Entry screen lists every retained detection grouped by date.
///
/// Nothing is removed until the user logs or ignores it, so the lists stay
/// stable across refreshes.
class SmsSuggestionsStore extends ChangeNotifier {
  SmsSuggestionsStore._();

  static final SmsSuggestionsStore instance = SmsSuggestionsStore._();

  final SmsParserService _service = SmsParserService.instance;

  StreamSubscription<void>? _subscription;
  bool _initialized = false;
  List<Map<String, dynamic>> _suggestions = const [];

  /// All retained suggestions, newest first.
  List<Map<String, dynamic>> get suggestions => _suggestions;

  /// Only today's suggestions — used by the dashboard section.
  List<Map<String, dynamic>> get todaySuggestions => _todayOnly(_suggestions);

  int get count => _suggestions.length;

  int get todayCount => todaySuggestions.length;

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

  // TEMP TEST DATA — remove once SMS parsing has been verified.
  Future<void> seedTestData() async {
    if (!isSupported) return;
    try {
      await _service.seedTestMessages();
      await refresh();
    } catch (_) {
      // Ignore — only used to populate the lists for manual testing.
    }
  }

  /// Reloads the retained suggestions from the native store.
  Future<void> refresh() async {
    if (!isSupported) return;
    try {
      final all = await _service.getPendingCandidates();
      final sorted = List<Map<String, dynamic>>.from(all)
        ..sort((a, b) => _receivedAt(b).compareTo(_receivedAt(a)));
      _setSuggestions(sorted);
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

  /// Ignores every retained suggestion (used by the SMS Entry screen).
  Future<void> ignoreAll() async {
    final ids = _idsOf(_suggestions);
    _setSuggestions(const []);
    await _service.removeCandidates(ids);
  }

  /// Ignores only today's suggestions (used by the dashboard section).
  Future<void> ignoreAllToday() async {
    final ids = _idsOf(todaySuggestions);
    _setSuggestions(
      _suggestions
          .where((item) => !ids.contains(item['id']?.toString()))
          .toList(),
    );
    await _service.removeCandidates(ids);
  }

  /// Removes a suggestion once the user has logged it as a ledger entry.
  Future<void> markEntered(String id) => ignore(id);

  /// Groups the retained suggestions by local calendar day, preserving the
  /// newest-first order of both the days and the items within each day.
  Map<DateTime, List<Map<String, dynamic>>> groupedByDay() {
    final groups = <DateTime, List<Map<String, dynamic>>>{};
    for (final item in _suggestions) {
      final at = _receivedAt(item);
      final day = DateTime(at.year, at.month, at.day);
      groups.putIfAbsent(day, () => <Map<String, dynamic>>[]).add(item);
    }
    return groups;
  }

  List<String> _idsOf(List<Map<String, dynamic>> items) => items
      .map((item) => item['id']?.toString())
      .whereType<String>()
      .toList();

  void _setSuggestions(List<Map<String, dynamic>> next) {
    _suggestions = next;
    notifyListeners();
  }

  DateTime _receivedAt(Map<String, dynamic> item) {
    final raw = item['receivedAt'];
    final millis = raw is num ? raw.toInt() : int.tryParse('$raw');
    if (millis == null || millis <= 0) {
      return DateTime.fromMillisecondsSinceEpoch(0);
    }
    return DateTime.fromMillisecondsSinceEpoch(millis);
  }

  List<Map<String, dynamic>> _todayOnly(List<Map<String, dynamic>> items) {
    final now = DateTime.now();
    return items.where((item) {
      final date = _receivedAt(item);
      return date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    }).toList();
  }
}
