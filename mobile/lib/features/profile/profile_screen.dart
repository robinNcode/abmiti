import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/widgets/glossy_card.dart';

/// User profile and settings screen with membership info and sign out.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.auth,
  });

  final AuthRepository auth;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _tier = 'free';
  String _validUntil = '';
  bool _initiatingPayment = false;

  @override
  void initState() {
    super.initState();
    _loadSubscription();
  }

  Future<void> _loadSubscription() async {
    try {
      final response = await widget.auth.apiClient.client.get('/subscriptions');
      final data = response.data;
      if (data is Map<String, dynamic> &&
          data['data'] is Map<String, dynamic>) {
        final sub = data['data'] as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _tier = sub['tier']?.toString() ?? 'free';
            _validUntil = sub['validUntil']?.toString() ?? '';
          });
        }
        return;
      }
    } catch (_) {}
  }

  Future<void> _upgradePlan() async {
    setState(() => _initiatingPayment = true);
    try {
      final response = await widget.auth.apiClient.client.post(
        '/payments/start',
        data: {'plan': 'premium'},
      );
      final data = response.data;
      if (data is Map<String, dynamic> &&
          data['data'] is Map<String, dynamic> &&
          data['data']['gatewayUrl'] != null) {
        final url = Uri.parse(data['data']['gatewayUrl'].toString());
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _initiatingPayment = false);
    }
  }

  Future<void> _signOut() async {
    final loc = context.appLocale;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(loc.tr('sign_out')),
        content: Text(loc.tr('sign_out_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(loc.tr('cancel')),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(loc.tr('sign_out')),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await widget.auth.signOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;
    final user = widget.auth.currentUser;
    final name = user?['name']?.toString() ?? loc.tr('default_user_name');
    final email = user?['email']?.toString() ?? '';
    final isPro =
        _tier.toLowerCase() == 'pro' || _tier.toLowerCase() == 'premium';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('profile_title'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        children: [
          // ── User Header Card ───────────────────────────────────────
          GlossyCard(
            gradient: AppColors.warmGlassGradient,
            borderRadius: 24,
            padding: const EdgeInsets.all(22),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.terra,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'A',
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        email,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.ink.withAlpha(180),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: isPro ? AppColors.sage : AppColors.terra,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          isPro ? loc.tr('pro_member') : loc.tr('free_plan'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      if (isPro && _validUntil.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          loc.tr('valid_until').replaceAll('{n}', _validUntil),
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.ink.withAlpha(160),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Membership & Upgrade Card ──────────────────────────────
          if (!isPro)
            GlossyCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.workspace_premium_rounded,
                        color: AppColors.mustard,
                        size: 26,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        loc.tr('unlock_pro'),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    loc.tr('pro_description'),
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? AppColors.darkMuted : AppColors.inkLight,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _initiatingPayment ? null : _upgradePlan,
                    icon: _initiatingPayment
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.bolt_rounded, size: 18),
                    label: Text(
                      _initiatingPayment
                          ? loc.tr('opening_gateway')
                          : loc.tr('upgrade_btn'),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 24),

          // ── Settings List ──────────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkElevated : AppColors.paperCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : AppColors.paperMist,
              ),
            ),
            child: Column(
              children: [
                _SettingsTile(
                  icon: Icons.security_rounded,
                  title: loc.tr('halal_finance'),
                  subtitle: loc.tr('halal_subtitle'),
                  onTap: () {},
                ),
                Divider(
                  height: 1,
                  color: isDark ? AppColors.darkBorder : AppColors.paperMist,
                ),
                _SettingsTile(
                  icon: Icons.language_rounded,
                  title: loc.tr('language_switch'),
                  subtitle: context.appLocale.isBengali
                      ? 'বাংলা (Bengali)'
                      : 'English',
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        title: Text(
                          loc.tr('select_language'),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              title: const Text('English'),
                              trailing: !context.appLocale.isBengali
                                  ? const Icon(Icons.check_circle_rounded,
                                      color: AppColors.terra)
                                  : null,
                              onTap: () {
                                context.appLocale.setLanguage(AppLanguage.en);
                                Navigator.pop(ctx);
                              },
                            ),
                            ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              title: const Text('বাংলা (Bengali)'),
                              trailing: context.appLocale.isBengali
                                  ? const Icon(Icons.check_circle_rounded,
                                      color: AppColors.terra)
                                  : null,
                              onTap: () {
                                context.appLocale.setLanguage(AppLanguage.bn);
                                Navigator.pop(ctx);
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                Divider(
                  height: 1,
                  color: isDark ? AppColors.darkBorder : AppColors.paperMist,
                ),
                _SettingsTile(
                  icon: Icons.info_outline_rounded,
                  title: loc.tr('about_abmiti'),
                  subtitle: loc.tr('about_version'),
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Sign Out Button ────────────────────────────────────────
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: const BorderSide(color: AppColors.danger),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: _signOut,
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: Text(
              loc.tr('sign_out'),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListTile(
      leading: Icon(icon, color: AppColors.terra, size: 22),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: isDark ? AppColors.darkMuted : AppColors.inkLight,
        ),
      ),
      onTap: onTap,
    );
  }
}
