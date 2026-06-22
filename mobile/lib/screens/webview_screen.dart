import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/app_config.dart';
import '../services/connectivity_service.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;

  bool _isLoading = true;
  bool _isOffline = false;
  bool _hasError = false;
  double _loadingProgress = 0;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  // ── Initialise ────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _initWebView();
    _listenToConnectivity();
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(AppConfig.splashColorHex))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() {
            _isLoading = true;
            _hasError = false;
          }),
          onProgress: (p) => setState(() => _loadingProgress = p / 100),
          onPageFinished: (_) => setState(() => _isLoading = false),
          onWebResourceError: (error) {
            // Only surface page-level errors, not sub-resource 4xx/5xx
            if (error.isForMainFrame ?? false) {
              setState(() {
                _isLoading = false;
                _hasError = true;
              });
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.parse(request.url);
            final base = Uri.parse(AppConfig.baseUrl);
            // Allow same-origin and auth redirects; block external navigations
            if (uri.host == base.host || uri.scheme == 'about') {
              return NavigationDecision.navigate;
            }
            // External URLs (mailto:, tel:, etc.) — prevent hijacking the WebView
            return NavigationDecision.prevent;
          },
        ),
      )
      // Inject a JS helper so the web app can call Flutter from JavaScript
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: _onJsMessage,
      )
      ..loadRequest(Uri.parse(AppConfig.baseUrl));
  }

  void _listenToConnectivity() {
    _connectivitySub =
        ConnectivityService.onConnectivityChanged.listen((results) async {
      final connected = results.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);
      if (connected && _isOffline) {
        setState(() => _isOffline = false);
        await _controller.reload();
      } else if (!connected) {
        setState(() => _isOffline = true);
      }
    });
  }

  void _onJsMessage(JavaScriptMessage message) {
    // Handle messages sent from the web app via:
    //   window.FlutterBridge.postMessage(JSON.stringify({ type: 'SHARE', url: '...' }))
    debugPrint('[FlutterBridge] ${message.message}');
  }

  // ── Back-button handling ──────────────────────────────────────────────────

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // swallow the pop
    }
    // Show "exit app?" dialog
    return await _showExitDialog();
  }

  Future<bool> _showExitDialog() async {
    return await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Exit App?'),
            content: const Text('Do you want to exit Abmiti?'),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('No'),
              ),
              FilledButton(
                onPressed: () {
                  Navigator.of(context).pop(true);
                  SystemNavigator.pop();
                },
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(AppConfig.brandColorHex),
                ),
                child: const Text('Exit'),
              ),
            ],
          ),
        ) ??
        false;
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) await _onWillPop();
      },
      child: Scaffold(
        backgroundColor: const Color(AppConfig.splashColorHex),
        body: _isOffline
            ? _buildOfflineView()
            : _hasError
                ? _buildErrorView()
                : Stack(
                    children: [
                      // ── The actual WebView ────────────────────────────────
                      WebViewWidget(controller: _controller),

                      // ── Top loading bar ───────────────────────────────────
                      if (_isLoading)
                        Positioned(
                          top: MediaQuery.of(context).padding.top,
                          left: 0,
                          right: 0,
                          child: _LoadingBar(progress: _loadingProgress),
                        ),
                    ],
                  ),
      ),
    );
  }

  // ── Offline view ──────────────────────────────────────────────────────────

  Widget _buildOfflineView() {
    return _StatusPage(
      icon: Icons.wifi_off_rounded,
      title: 'No Internet Connection',
      body:
          'Please check your network and try again. Abmiti needs an internet connection to work.',
      buttonLabel: 'Retry',
      onButton: () async {
        final ok = await ConnectivityService.isConnected();
        if (ok) {
          setState(() => _isOffline = false);
          await _controller.reload();
        }
      },
    );
  }

  // ── Error view ────────────────────────────────────────────────────────────

  Widget _buildErrorView() {
    return _StatusPage(
      icon: Icons.error_outline_rounded,
      title: 'Something went wrong',
      body:
          'The page failed to load. Please check your connection or try again later.',
      buttonLabel: 'Reload',
      onButton: () {
        setState(() => _hasError = false);
        _controller.reload();
      },
    );
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}

// ── Reusable widgets ─────────────────────────────────────────────────────────

class _LoadingBar extends StatelessWidget {
  const _LoadingBar({required this.progress});
  final double progress;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 3,
      child: ClipRRect(
        child: LinearProgressIndicator(
          value: progress > 0 ? progress : null,
          backgroundColor: Colors.transparent,
          valueColor: const AlwaysStoppedAnimation<Color>(
            Color(AppConfig.brandColorHex),
          ),
        ),
      ),
    );
  }
}

class _StatusPage extends StatelessWidget {
  const _StatusPage({
    required this.icon,
    required this.title,
    required this.body,
    required this.buttonLabel,
    required this.onButton,
  });

  final IconData icon;
  final String title;
  final String body;
  final String buttonLabel;
  final VoidCallback onButton;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: const Color(AppConfig.brandColorHex).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon,
                    size: 40, color: const Color(AppConfig.brandColorHex)),
              ),
              const SizedBox(height: 24),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1309),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                body,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF7A6A56),
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: onButton,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(AppConfig.brandColorHex),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    buttonLabel,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
