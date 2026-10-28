import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import 'app_config.dart';

/// Read-only info sheet showing the current API environment and connection status.
///
/// In debug builds the developer can test connectivity.
/// In release builds the URL is locked to production automatically.
class EnvSwitcherSheet extends StatefulWidget {
  const EnvSwitcherSheet({
    super.key,
    required this.config,
    required this.apiClient,
  });

  final AppConfig config;
  final ApiClient apiClient;

  static Future<void> show(
    BuildContext context, {
    required AppConfig config,
    required ApiClient apiClient,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EnvSwitcherSheet(
        config: config,
        apiClient: apiClient,
      ),
    );
  }

  @override
  State<EnvSwitcherSheet> createState() => _EnvSwitcherSheetState();
}

class _EnvSwitcherSheetState extends State<EnvSwitcherSheet> {
  bool _testing = false;
  ({bool success, int latencyMs, String message})? _testResult;

  Future<void> _testConnection() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });
    final result = await widget.apiClient.testConnection();
    if (mounted) {
      setState(() {
        _testing = false;
        _testResult = result;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final env = widget.config.currentEnv;
    final url = widget.config.currentBaseUrl;
    final isProduction = env == ApiEnvironment.production;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E211E) : AppColors.paper,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withAlpha(80),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title row
          Row(
            children: [
              Icon(
                isProduction ? Icons.cloud_done : Icons.computer,
                color: AppColors.terra,
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'API Environment',
                style: theme.textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isProduction
                      ? AppColors.sage.withAlpha(30)
                      : Colors.orange.withAlpha(30),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(
                    color: isProduction
                        ? AppColors.sage.withAlpha(120)
                        : Colors.orange.withAlpha(120),
                  ),
                ),
                child: Text(
                  env.name,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isProduction ? AppColors.sage : Colors.orange[700],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // URL card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withAlpha(60)
                  : Colors.grey.withAlpha(20),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.withAlpha(40)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Base URL',
                  style: theme.textTheme.labelSmall
                      ?.copyWith(color: Colors.grey[500]),
                ),
                const SizedBox(height: 4),
                Text(
                  url,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w500,
                    color: AppColors.terra,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Info text
          Text(
            isProduction
                ? '🔒 Production mode — URL is locked to the live server.'
                : kReleaseMode
                    ? '🔒 Release build always uses production.'
                    : '🛠️ Debug build — connects to local dev server.\n'
                      'Use ADB reverse: adb reverse tcp:5000 tcp:5000\n'
                      'Or build with --dart-define=API_BASE_URL=https://your-tunnel',
            style: theme.textTheme.bodySmall
                ?.copyWith(color: Colors.grey[500], height: 1.6),
          ),
          const SizedBox(height: 20),

          // Test connection button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _testing ? null : _testConnection,
              icon: _testing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.wifi_tethering, size: 18),
              label: Text(_testing ? 'Testing…' : 'Test Connection'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.terra,
                side: BorderSide(color: AppColors.terra.withAlpha(120)),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),

          // Test result
          if (_testResult != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _testResult!.success
                    ? AppColors.sage.withAlpha(25)
                    : Colors.red.withAlpha(20),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _testResult!.success
                      ? AppColors.sage.withAlpha(100)
                      : Colors.red.withAlpha(80),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _testResult!.success
                        ? Icons.check_circle_outline
                        : Icons.error_outline,
                    size: 18,
                    color: _testResult!.success ? AppColors.sage : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _testResult!.message,
                      style: TextStyle(
                        fontSize: 13,
                        color: _testResult!.success
                            ? AppColors.sage
                            : Colors.red[700],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
