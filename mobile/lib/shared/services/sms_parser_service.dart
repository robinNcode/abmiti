import 'dart:io';

import 'package:flutter/services.dart';

class SmsParserService {
  SmsParserService._();

  static final SmsParserService instance = SmsParserService._();

  static const _methods = MethodChannel('com.abmiti/sms_parser');
  static const _events = EventChannel('com.abmiti/sms_parser/events');

  bool get isSupported => Platform.isAndroid;

  Stream<void> get incomingCandidates {
    if (!isSupported) return const Stream<void>.empty();
    return _events.receiveBroadcastStream().map((_) {});
  }

  Future<Map<String, dynamic>> getStatus() async {
    if (!isSupported) {
      return const {
        'supported': false,
        'decisionMade': true,
        'enabled': false,
      };
    }
    final result = await _methods.invokeMapMethod<String, dynamic>('getStatus');
    return result ??
        const {
          'supported': true,
          'decisionMade': false,
          'enabled': false,
        };
  }

  Future<void> recordConsent(bool enabled) async {
    if (!isSupported) return;
    await _methods.invokeMethod<void>('recordConsent', {'enabled': enabled});
  }

  Future<bool> requestPermission() async {
    if (!isSupported) return false;
    return await _methods.invokeMethod<bool>('requestPermission') ?? false;
  }

  Future<bool> setEnabled(bool enabled) async {
    if (!isSupported) return false;
    return await _methods
            .invokeMethod<bool>('setEnabled', {'enabled': enabled}) ??
        false;
  }

  /// Reads the detected suggestions without clearing them, so they remain on
  /// the dashboard until the user confirms or ignores each one.
  Future<List<Map<String, dynamic>>> getPendingCandidates() async {
    if (!isSupported) return const [];
    final candidates =
        await _methods.invokeListMethod<dynamic>('getPendingCandidates');
    return _asCandidateList(candidates);
  }

  Future<void> removeCandidate(String id) => removeCandidates([id]);

  Future<void> removeCandidates(List<String> ids) async {
    if (!isSupported || ids.isEmpty) return;
    await _methods.invokeMethod<void>('removeCandidates', {'ids': ids});
  }

  // TEMP TEST DATA — remove once SMS parsing has been verified.
  Future<void> seedTestMessages() async {
    if (!isSupported) return;
    await _methods.invokeMethod<void>('seedTestMessages');
  }

  /// Legacy drain-style API kept for backwards compatibility.
  Future<List<Map<String, dynamic>>> consumePendingCandidates() async {
    if (!isSupported) return const [];
    final candidates =
        await _methods.invokeListMethod<dynamic>('consumePendingCandidates');
    return _asCandidateList(candidates);
  }

  List<Map<String, dynamic>> _asCandidateList(dynamic candidates) {
    // Build a strongly typed list instead of chaining off a `dynamic` value:
    // dynamic dispatch makes `whereType(...).map(...).toList()` produce a
    // `List<dynamic>`, which fails the cast to `List<Map<String, dynamic>>`.
    final result = <Map<String, dynamic>>[];
    if (candidates is List) {
      for (final candidate in candidates) {
        if (candidate is Map) {
          result.add(Map<String, dynamic>.from(candidate));
        }
      }
    }
    return result;
  }
}
