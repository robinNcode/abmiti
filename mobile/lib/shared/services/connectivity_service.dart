import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

/// Service that broadcasts connectivity state changes as a boolean stream.
///
/// `true`  → at least one network interface is available.
/// `false` → no connectivity (offline).
class ConnectivityService {
  final _controller = StreamController<bool>.broadcast();

  /// Stream of connectivity state. Listen to react on network changes.
  Stream<bool> get onConnectivityChanged => _controller.stream;

  ConnectivityService() {
    // Immediately emit on changes
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final isConnected = results.isNotEmpty &&
          results.any((r) => r != ConnectivityResult.none);
      _controller.add(isConnected);
    });
  }

  /// One-shot connectivity check. Use for initial state or retry button.
  Future<bool> isConnected() async {
    final results = await Connectivity().checkConnectivity();
    return results.isNotEmpty &&
        results.any((r) => r != ConnectivityResult.none);
  }

  /// Must be called when the service is no longer needed.
  void dispose() {
    _controller.close();
  }
}
