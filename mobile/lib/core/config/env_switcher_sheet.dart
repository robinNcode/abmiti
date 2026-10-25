import 'package:flutter/material.dart';

import '../constants/app_colors.dart';
import '../localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import 'app_config.dart';

/// Modal bottom sheet allowing developers to dynamically inspect, test,
/// and switch the active API_BASE_URL between environments:
/// - Different Router (USB / ADB Reverse)
/// - Same Router (Local Wi-Fi / LAN IP)
/// - Production
/// - Custom / Tunnel (Cloudflare tunnel, ngrok, localtunnel)
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
  late ApiEnvironment _selectedEnv;
  late final TextEditingController _customUrlController;
  late final TextEditingController _lanIpController;

  bool _testing = false;
  ({bool success, int latencyMs, String message})? _testResult;

  @override
  void initState() {
    super.initState();
    _selectedEnv = widget.config.currentEnv;
    _customUrlController = TextEditingController(
      text: widget.config.currentBaseUrl,
    );
    _lanIpController = TextEditingController(
      text: _extractHost(widget.config.currentBaseUrl),
    );
  }

  @override
  void dispose() {
    _customUrlController.dispose();
    _lanIpController.dispose();
    super.dispose();
  }

  String _extractHost(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host.isNotEmpty ? uri.host : '192.168.26.65';
    } catch (_) {
      return '192.168.26.65';
    }
  }

  String _resolveTargetUrl() {
    switch (_selectedEnv) {
      case ApiEnvironment.differentRouterUsb:
        return ApiEnvironment.differentRouterUsb.defaultUrl;
      case ApiEnvironment.sameRouterLan:
        final ip = _lanIpController.text.trim().isNotEmpty
            ? _lanIpController.text.trim()
            : '192.168.26.65';
        return 'http://$ip:5000/api/v1';
      case ApiEnvironment.production:
        return ApiEnvironment.production.defaultUrl;
      case ApiEnvironment.custom:
        return _customUrlController.text.trim();
    }
  }

  Future<void> _testConnection() async {
    final target = _resolveTargetUrl();
    setState(() {
      _testing = true;
      _testResult = null;
    });

    final result = await widget.apiClient.testConnection(target);

    if (mounted) {
      setState(() {
        _testing = false;
        _testResult = result;
      });
    }
  }

  Future<void> _applyAndClose() async {
    final target = _resolveTargetUrl();
    if (_selectedEnv == ApiEnvironment.custom) {
      await widget.config.setEnvironment(_selectedEnv, customUrl: target);
    } else if (_selectedEnv == ApiEnvironment.sameRouterLan) {
      await widget.config.setEnvironment(_selectedEnv, customUrl: target);
    } else {
      await widget.config.setEnvironment(_selectedEnv);
    }
    widget.apiClient.updateBaseUrl(target);

    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.appLocale.tr('switched_api').replaceAll('{n}', target),
          ),
          backgroundColor: AppColors.sageDark,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final loc = context.appLocale;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E211E) : AppColors.paper,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.settings_input_antenna,
                    color: AppColors.terra),
                const SizedBox(width: 10),
                Text(
                  loc.tr('api_env_title'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              loc.tr('api_env_subtitle'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),

            // Environment selection radio list
            ...ApiEnvironment.values.map((env) {
              final isSelected = _selectedEnv == env;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.terra
                        : (isDark ? Colors.grey[800]! : Colors.grey[300]!),
                    width: isSelected ? 2 : 1,
                  ),
                  color: isSelected
                      ? AppColors.terra.withAlpha(20)
                      : (isDark ? const Color(0xFF262A26) : Colors.white),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => setState(() {
                    _selectedEnv = env;
                    _testResult = null;
                  }),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _iconFor(env),
                              size: 20,
                              color: isSelected ? AppColors.terra : Colors.grey,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                loc.tr('env_${env.id}'),
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: isSelected ? AppColors.terra : null,
                                ),
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle,
                                color: AppColors.terra,
                                size: 18,
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          loc.tr('env_${env.id}_desc'),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.black26 : Colors.grey[100],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            env == ApiEnvironment.sameRouterLan
                                ? 'http://${_lanIpController.text}:5000/api/v1'
                                : (env == ApiEnvironment.custom
                                    ? _customUrlController.text
                                    : env.defaultUrl),
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: isDark
                                  ? AppColors.mustardLight
                                  : AppColors.mustard,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            // Additional field for Same Router (LAN IP edit)
            if (_selectedEnv == ApiEnvironment.sameRouterLan) ...[
              const SizedBox(height: 8),
              TextField(
                controller: _lanIpController,
                decoration: InputDecoration(
                  labelText: loc.tr('lan_ip_label'),
                  hintText: '192.168.26.65',
                  prefixIcon: const Icon(Icons.computer),
                  border: const OutlineInputBorder(),
                  helperText: loc.tr('lan_ip_helper'),
                ),
                onChanged: (_) => setState(() => _testResult = null),
              ),
            ],

            // Additional field for Custom URL
            if (_selectedEnv == ApiEnvironment.custom) ...[
              const SizedBox(height: 8),
              TextField(
                controller: _customUrlController,
                decoration: InputDecoration(
                  labelText: loc.tr('custom_url_label'),
                  hintText: 'https://xxx.trycloudflare.com/api/v1',
                  prefixIcon: const Icon(Icons.link),
                  border: const OutlineInputBorder(),
                  helperText: loc.tr('custom_url_helper'),
                ),
                onChanged: (_) => setState(() => _testResult = null),
              ),
            ],

            // Diff router hint
            if (_selectedEnv == ApiEnvironment.differentRouterUsb) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.sage.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.sage.withAlpha(80)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline,
                        size: 18, color: AppColors.sageDark),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        loc.tr('usb_hint'),
                        style: const TextStyle(fontSize: 11.5, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Test connection result
            if (_testResult != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _testResult!.success
                      ? Colors.green.withAlpha(25)
                      : Colors.red.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _testResult!.success
                        ? Colors.green
                        : Colors.red.withAlpha(150),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _testResult!.success ? Icons.check_circle : Icons.error,
                      color: _testResult!.success ? Colors.green : Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _testResult!.message,
                        style: TextStyle(
                          fontSize: 12,
                          color: _testResult!.success
                              ? Colors.green[800]
                              : Colors.red[800],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _testing ? null : _testConnection,
                    icon: _testing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.wifi_find, size: 18),
                    label: Text(
                      _testing ? loc.tr('testing') : loc.tr('test_ping'),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _applyAndClose,
                    icon: const Icon(Icons.check, size: 18),
                    label: Text(loc.tr('apply_url')),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(ApiEnvironment env) {
    switch (env) {
      case ApiEnvironment.differentRouterUsb:
        return Icons.usb;
      case ApiEnvironment.sameRouterLan:
        return Icons.router;
      case ApiEnvironment.production:
        return Icons.cloud_done;
      case ApiEnvironment.custom:
        return Icons.tune;
    }
  }
}
