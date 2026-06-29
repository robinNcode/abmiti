import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/services/connectivity_service.dart';
import '../../shared/widgets/loading_overlay.dart';
import '../../shared/widgets/no_internet_screen.dart';

/// The main and only screen of the Abmiti app.
///
/// Renders the Abmiti web application in a full-screen WebView with:
///  - Branded loading overlay (no browser chrome)
///  - Double-back-press-to-exit with Bengali toast
///  - Web history back navigation on single back press
///  - External URL opening via system browser
///  - Offline detection + branded no-internet screen with retry
///  - JavaScript bridge for native haptic feedback
///  - Pull-to-refresh support
class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  static const String _initialUrl = 'https://voltwavebd.com/abmiti';
  static const String _userAgent =
      'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/120.0.0.0 Mobile Safari/537.36 AbmitiApp/1.0';

  late final WebViewController _controller;
  late final ConnectivityService _connectivityService;
  late final StreamSubscription<bool> _connectivitySubscription;

  bool _isLoading = true;
  bool _hasError = false;
  bool _isOffline = false;
  String _currentUrl = _initialUrl;
  DateTime? _lastBackPressed;

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _initController();
    _listenConnectivity();
  }

  void _initController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.paper)
      ..setUserAgent(_userAgent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() {
              _isLoading = true;
              _hasError = false;
              _currentUrl = url;
            });
          },
          onPageFinished: (url) {
            setState(() => _isLoading = false);
          },
          onWebResourceError: _handleWebResourceError,
          onNavigationRequest: _handleNavigationRequest,
        ),
      )
      ..addJavaScriptChannel(
        'AbmitiNative',
        onMessageReceived: _handleNativeMessage,
      )
      ..loadRequest(Uri.parse(_initialUrl));
  }

  void _listenConnectivity() {
    _connectivitySubscription =
        _connectivityService.onConnectivityChanged.listen((isConnected) {
      if (mounted) {
        if (isConnected && _isOffline) {
          // Came back online — reload the last attempted page
          setState(() => _isOffline = false);
          _controller.loadRequest(Uri.parse(_currentUrl));
        } else if (!isConnected) {
          setState(() => _isOffline = true);
        }
      }
    });
  }

  NavigationDecision _handleNavigationRequest(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.navigate;

    // Allow all voltwavebd.com traffic inside the WebView
    final isInternal = uri.host.contains('voltwavebd.com');
    if (!isInternal) {
      // Open external links in the system browser
      launchUrl(uri, mode: LaunchMode.externalApplication);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  void _handleWebResourceError(WebResourceError error) {
    // Only treat main-frame errors as fatal
    if (error.isForMainFrame == true) {
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  void _handleNativeMessage(JavaScriptMessage message) {
    switch (message.message) {
      case 'HAPTIC':
        HapticFeedback.lightImpact();
      case 'HAPTIC_MEDIUM':
        HapticFeedback.mediumImpact();
      case 'HAPTIC_HEAVY':
        HapticFeedback.heavyImpact();
      case 'HAPTIC_SUCCESS':
        HapticFeedback.selectionClick();
    }
  }

  Future<void> _handlePopInvoked(bool didPop, Object? result) async {
    if (didPop) return;

    if (await _controller.canGoBack()) {
      await _controller.goBack();
    } else {
      _showExitToast();
    }
  }

  void _showExitToast() {
    final now = DateTime.now();
    if (_lastBackPressed == null ||
        now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
      _lastBackPressed = now;
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'আবার চাপলে অ্যাপ বন্ধ হবে',
            style: TextStyle(
              color: AppColors.paper,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          duration: const Duration(seconds: 2),
          backgroundColor: AppColors.terraDark,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        ),
      );
    } else {
      SystemNavigator.pop();
    }
  }

  Future<void> _retryConnection() async {
    final isConnected = await _connectivityService.isConnected();
    if (isConnected && mounted) {
      setState(() => _isOffline = false);
      await _controller.loadRequest(Uri.parse(_currentUrl));
    }
  }

  @override
  void dispose() {
    _connectivitySubscription.cancel();
    _connectivityService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isOffline) {
      return NoInternetScreen(onRetry: _retryConnection);
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: _handlePopInvoked,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: Stack(
          children: [
            // Pull-to-refresh wrapping the WebView
            RefreshIndicator(
              color: AppColors.terra,
              backgroundColor: AppColors.paper,
              onRefresh: () async {
                await _controller.reload();
              },
              // Disable pull-to-refresh — WebView handles scrolling
              // Re-enable this line to allow pull-to-refresh:
              // child: _buildWebView(),
              child: _buildWebView(),
            ),

            // Branded full-screen loading overlay
            if (_isLoading) const LoadingOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildWebView() {
    if (_hasError) {
      return _buildErrorView();
    }
    return WebViewWidget(controller: _controller);
  }

  Widget _buildErrorView() {
    return Container(
      color: AppColors.terra,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.cloud_off_rounded,
                color: AppColors.paper,
                size: 64,
              ),
              const SizedBox(height: 24),
              const Text(
                'পেজ লোড হয়নি',
                style: TextStyle(
                  color: AppColors.paper,
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'সংযোগ সমস্যার কারণে পেজটি লোড হয়নি।\nঅনুগ্রহ করে আবার চেষ্টা করুন।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.paper.withAlpha(200),
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 36),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() => _hasError = false);
                  _controller.loadRequest(Uri.parse(_currentUrl));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.paper,
                  foregroundColor: AppColors.terra,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 28,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text(
                  'পুনরায় লোড করুন',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
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
