import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/widgets/loading_overlay.dart';

/// Full-screen in-app OAuth sheet for Google Sign-In in APK.
///
/// Loads the backend `/auth/google` route in WebView.
/// When the server finishes OAuth, it redirects to the frontend callback URL with
/// tokens in URL fragment: `#accessToken=...&refreshToken=...`.
/// This WebView intercepts that URL, extracts the tokens, closes the modal, and returns them.
class GoogleAuthWebView extends StatefulWidget {
  const GoogleAuthWebView({
    super.key,
    required this.authUrl,
  });

  final String authUrl;

  /// Shows the Google OAuth modal and returns `({String accessToken, String refreshToken})?`.
  static Future<({String accessToken, String refreshToken})?> start(
    BuildContext context, {
    required String authUrl,
  }) {
    return Navigator.push<({String accessToken, String refreshToken})>(
      context,
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => GoogleAuthWebView(authUrl: authUrl),
      ),
    );
  }

  @override
  State<GoogleAuthWebView> createState() => _GoogleAuthWebViewState();
}

class _GoogleAuthWebViewState extends State<GoogleAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _errorMessage;

  static const String _userAgent =
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/120.0.0.0 Mobile Safari/537.36';

  @override
  void initState() {
    super.initState();
    _initController();
  }

  void _initController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setUserAgent(_userAgent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            _checkInterceptUrl(url);
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (url) {
            _checkInterceptUrl(url);
            if (mounted) setState(() => _isLoading = false);
          },
          onNavigationRequest: (request) {
            if (_checkInterceptUrl(request.url)) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) {
              setState(() {
                _isLoading = false;
                _errorMessage = error.description;
              });
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  bool _checkInterceptUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    // Check query params for error
    if (uri.queryParameters.containsKey('error')) {
      final error = uri.queryParameters['error'];
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Google authentication failed'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
      return true;
    }

    // Check fragment: #accessToken=...&refreshToken=...
    final fragment = uri.fragment;
    if (fragment.isNotEmpty && fragment.contains('accessToken=')) {
      final fragmentParams = Uri.splitQueryString(fragment);
      final accessToken = fragmentParams['accessToken'];
      final refreshToken = fragmentParams['refreshToken'];

      if (accessToken != null && refreshToken != null && mounted) {
        Navigator.pop(context, (accessToken: accessToken, refreshToken: refreshToken));
        return true;
      }
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Google Sign In',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.ink,
        elevation: 0.5,
      ),
      body: Stack(
        children: [
          if (_errorMessage != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        color: AppColors.danger, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.black87),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _errorMessage = null;
                          _isLoading = true;
                        });
                        _controller.loadRequest(Uri.parse(widget.authUrl));
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else
            WebViewWidget(controller: _controller),
          if (_isLoading) const LoadingOverlay(),
        ],
      ),
    );
  }
}
