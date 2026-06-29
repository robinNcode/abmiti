import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Branded offline screen shown when the device has no internet connection.
///
/// Displays a Bengali message, the Abmiti brand, and a Retry button.
/// The parent [WebViewScreen] provides [onRetry] which re-checks connectivity
/// and reloads the last attempted URL.
class NoInternetScreen extends StatefulWidget {
  /// Called when the user taps the Retry button.
  final VoidCallback onRetry;

  const NoInternetScreen({
    super.key,
    required this.onRetry,
  });

  @override
  State<NoInternetScreen> createState() => _NoInternetScreenState();
}

class _NoInternetScreenState extends State<NoInternetScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounceController;
  late final Animation<double> _bounceAnim;
  bool _isRetrying = false;

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _bounceAnim = Tween<double>(begin: -8.0, end: 8.0).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _bounceController.dispose();
    super.dispose();
  }

  Future<void> _handleRetry() async {
    setState(() => _isRetrying = true);
    // Small delay so the user sees the loading state
    await Future.delayed(const Duration(milliseconds: 800));
    widget.onRetry();
    if (mounted) setState(() => _isRetrying = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.terra,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 36.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated wifi-off icon
                AnimatedBuilder(
                  animation: _bounceAnim,
                  builder: (context, child) => Transform.translate(
                    offset: Offset(0, _bounceAnim.value),
                    child: child,
                  ),
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.terraDark,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(60),
                          blurRadius: 24,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.wifi_off_rounded,
                      color: AppColors.paper,
                      size: 48,
                    ),
                  ),
                ),
                const SizedBox(height: 40),

                // App name
                const Text(
                  'অবমিতি',
                  style: TextStyle(
                    color: AppColors.paper,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 16),

                // Primary message in Bengali
                const Text(
                  'ইন্টারনেট সংযোগ নেই',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.paper,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),

                // Secondary message
                Text(
                  'আপনার নেটওয়ার্ক সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.paper.withAlpha(200),
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 48),

                // Retry button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _isRetrying ? null : _handleRetry,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.paper,
                      foregroundColor: AppColors.terra,
                      disabledBackgroundColor: AppColors.paper.withAlpha(140),
                      disabledForegroundColor: AppColors.terra.withAlpha(140),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: _isRetrying
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                AppColors.terra,
                              ),
                            ),
                          )
                        : const Icon(Icons.refresh_rounded, size: 20),
                    label: Text(
                      _isRetrying
                          ? 'পুনরায় চেষ্টা করা হচ্ছে...'
                          : 'আবার চেষ্টা করুন',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
