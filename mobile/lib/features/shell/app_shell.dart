import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/widgets/smart_bottom_nav_bar.dart';

import '../../core/config/app_config.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/services/sms_parser_service.dart';
import '../../shared/widgets/sms_parser_consent_dialog.dart';
import '../analytics/analytics_screen.dart';
import '../budgets/budget_screen.dart';
import '../categories/categories_screen.dart';
import '../home/activity_tab.dart';
import '../home/entry_form.dart';
import '../home/overview_tab.dart';
import '../notifications/notifications_screen.dart';
import '../payables/payables_screen.dart';
import '../profile/profile_screen.dart';
import '../receivables/receivables_screen.dart';
import '../reports/reports_screen.dart';

/// AppShell provides the core navigation experience:
/// - Responsive Smart Navigation Drawer with user profile header and grouped destinations
/// - CurvedNavigationBar modeled after `curved_navigation_bar`
/// - Top bar quick language switcher (English / বাংলা)
/// - FAB for fast transaction entry
class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    required this.auth,
    required this.financeRepo,
    this.config,
    this.apiClient,
  });

  final AuthRepository auth;
  final FinanceRepository financeRepo;
  final AppConfig? config;
  final ApiClient? apiClient;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with WidgetsBindingObserver {
  int _currentIndex = 0;
  int _unreadNotifications = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  StreamSubscription<void>? _smsSubscription;
  bool _smsEnabled = false;
  bool _showingSmsCandidate = false;

  String? get _userId {
    final user = widget.auth.currentUser;
    return (user?['_id'] ?? user?['id'])?.toString();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshUnreadCount();
    _initializeSmsParser();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _smsSubscription?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _consumePendingSmsCandidates();
  }

  Future<void> _initializeSmsParser() async {
    final smsParser = SmsParserService.instance;
    if (!smsParser.isSupported) return;

    _smsSubscription = smsParser.incomingCandidates.listen(
      (_) => _consumePendingSmsCandidates(),
      onError: (Object error, StackTrace stackTrace) {
        _showSmsError(error.toString());
      },
    );

    try {
      final status = await smsParser.getStatus();
      if (!mounted) return;
      _smsEnabled = status['enabled'] == true;
      if (status['decisionMade'] != true) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _askForSmsConsent();
        });
      } else if (_smsEnabled) {
        _consumePendingSmsCandidates();
      }
    } on PlatformException catch (error) {
      _showSmsError(error.message ?? context.appLocale.tr('sms_setup_error'));
    }
  }

  Future<void> _askForSmsConsent() async {
    final loc = context.appLocale;
    final accepted = await showSmsParserConsentDialog(context);
    final smsParser = SmsParserService.instance;
    try {
      await smsParser.recordConsent(accepted);
      if (!accepted) return;
      final granted = await smsParser.requestPermission();
      final enabled = granted && await smsParser.setEnabled(true);
      if (!mounted) return;
      setState(() => _smsEnabled = enabled);
      if (enabled) {
        _consumePendingSmsCandidates();
      } else {
        _showSmsError(loc.tr('sms_permission_denied'));
      }
    } on PlatformException catch (error) {
      _showSmsError(error.message ?? loc.tr('sms_setup_error'));
    }
  }

  Future<void> _consumePendingSmsCandidates() async {
    if (_showingSmsCandidate) return;
    final loc = context.appLocale;
    var consumedCandidates = false;
    try {
      final status = await SmsParserService.instance.getStatus();
      _smsEnabled = status['enabled'] == true;
      if (!_smsEnabled) return;
      final candidates =
          await SmsParserService.instance.consumePendingCandidates();
      if (!mounted || candidates.isEmpty) return;
      consumedCandidates = true;
      _showingSmsCandidate = true;
      for (final candidate in candidates) {
        if (!mounted) break;
        await _showSmsCandidate(candidate);
      }
    } on PlatformException catch (error) {
      _showSmsError(error.message ?? loc.tr('sms_setup_error'));
    } finally {
      _showingSmsCandidate = false;
      if (mounted && consumedCandidates) {
        unawaited(_consumePendingSmsCandidates());
      }
    }
  }

  Future<void> _showSmsCandidate(Map<String, dynamic> candidate) async {
    final loc = context.appLocale;
    final amount = candidate['amount'] is num
        ? (candidate['amount'] as num).toStringAsFixed(2)
        : candidate['amount']?.toString() ?? '';
    final receivedAt = candidate['receivedAt'] is num
        ? DateTime.fromMillisecondsSinceEpoch(
            (candidate['receivedAt'] as num).toInt(),
          )
        : DateTime.now();
    final review = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(loc.tr('sms_candidate_title')),
        content: Text(
          loc
              .tr('sms_candidate_message')
              .replaceAll('{provider}', candidate['provider']?.toString() ?? '')
              .replaceAll('{amount}', amount),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(loc.tr('sms_candidate_ignore')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(loc.tr('sms_candidate_review')),
          ),
        ],
      ),
    );
    if (review != true || !mounted) return;
    await EntryFormModal.show(
      context,
      financeRepo: widget.financeRepo,
      onEntryCreated: () => setState(() {}),
      initialAmount: candidate['amount'] is num
          ? candidate['amount'] as num
          : num.tryParse(candidate['amount']?.toString() ?? ''),
      initialNote: candidate['note']?.toString(),
      initialType: candidate['type']?.toString(),
      initialDate: receivedAt,
    );
  }

  void _showSmsError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _refreshUnreadCount() async {
    try {
      final items = await widget.financeRepo.fetchNotifications();
      if (!mounted) return;
      setState(
          () => _unreadNotifications = unreadNotificationCount(items, _userId));
    } catch (_) {
      // Background badge refresh — ignore failures.
    }
  }

  Future<void> _openNotifications() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NotificationsScreen(
          financeRepo: widget.financeRepo,
          userId: _userId,
        ),
      ),
    );
    _refreshUnreadCount();
  }

  void _onBottomNavTapped(int index) {
    setState(() => _currentIndex = index);
  }

  Future<void> _navigateToDrawerDestination(Widget screen) async {
    Navigator.pop(context); // close drawer
    final targetIndex = await Navigator.push<int>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
    if (targetIndex != null && mounted) {
      setState(() => _currentIndex = targetIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;
    final user = widget.auth.currentUser;
    final name = user?['name']?.toString() ?? loc.tr('default_user_name');
    // final email = user?['email']?.toString() ?? '';

    final pages = [
      OverviewTab(
        financeRepo: widget.financeRepo,
        auth: widget.auth,
        onNavigateToLedger: () => setState(() => _currentIndex = 1),
        onNavigateToBudgets: () => setState(() => _currentIndex = 2),
        onNavigateToPayables: () async {
          final target = await Navigator.push<int>(
            context,
            MaterialPageRoute(
              builder: (_) => PayablesScreen(financeRepo: widget.financeRepo),
            ),
          );
          if (target != null && mounted) {
            setState(() => _currentIndex = target);
          }
        },
        onNavigateToReceivables: () async {
          final target = await Navigator.push<int>(
            context,
            MaterialPageRoute(
              builder: (_) => ReceivablesScreen(financeRepo: widget.financeRepo),
            ),
          );
          if (target != null && mounted) {
            setState(() => _currentIndex = target);
          }
        },
      ),
      ActivityTab(financeRepo: widget.financeRepo),
      BudgetScreen(financeRepo: widget.financeRepo),
      AnalyticsScreen(financeRepo: widget.financeRepo),
    ];

    final titles = [
      loc.tr('app_title'),
      loc.tr('nav_activity'),
      loc.tr('nav_budgets'),
      loc.tr('nav_analytics'),
    ];

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          titles[_currentIndex],
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
        ),
        actions: [
          // ── Language Toggle Chip ──────────────────────────────────
          TextButton(
            onPressed: () => loc.toggleLanguage(),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.darkElevated
                    : AppColors.pastelPeach.withAlpha(140),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.terra.withAlpha(100),
                  width: 0.8,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.language_rounded,
                      size: 14, color: AppColors.terra),
                  const SizedBox(width: 4),
                  Text(
                    loc.isBengali ? 'EN' : 'বাং',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: isDark ? Colors.white : AppColors.ink,
                    ),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_none_rounded),
                if (_unreadNotifications > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 14,
                        minHeight: 14,
                      ),
                      child: Text(
                        _unreadNotifications > 9
                            ? '9+'
                            : '$_unreadNotifications',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 8,
                          height: 1,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            tooltip: loc.tr('notifications_title'),
            onPressed: _openNotifications,
          ),
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: loc.tr('nav_categories'),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    CategoriesScreen(financeRepo: widget.financeRepo),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline_rounded),
            tooltip: loc.tr('nav_profile'),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ProfileScreen(auth: widget.auth),
              ),
            ),
          ),
        ],
      ),

      // ── Smart App Drawer ───────────────────────────────────────────
      drawer: Drawer(
        backgroundColor: isDark ? AppColors.darkSurface : AppColors.paper,
        child: Column(
          children: [
            // Drawer Profile Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
              ),
              child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 35,
                  backgroundColor: Colors.white,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'A',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.terra,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            ),

            // Navigation Destinations
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12),
                children: [
                  _DrawerItem(
                    icon: Icons.dashboard_outlined,
                    label: loc.tr('nav_overview'),
                    selected: _currentIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 0);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.receipt_long_outlined,
                    label: loc.tr('nav_activity'),
                    selected: _currentIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 1);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.pie_chart_outline_rounded,
                    label: loc.tr('nav_budgets'),
                    selected: _currentIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 2);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.call_received_rounded,
                    label: loc.tr('nav_receivables'),
                    onTap: () => _navigateToDrawerDestination(
                      ReceivablesScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.credit_card_rounded,
                    label: loc.tr('nav_payables'),
                    onTap: () => _navigateToDrawerDestination(
                      PayablesScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.insights_rounded,
                    label: loc.tr('nav_analytics'),
                    selected: _currentIndex == 3,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 3);
                    },
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Divider(),
                  ),
                  _DrawerItem(
                    icon: Icons.category_outlined,
                    label: loc.tr('nav_categories'),
                    onTap: () => _navigateToDrawerDestination(
                      CategoriesScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.assessment_outlined,
                    label: loc.tr('nav_reports'),
                    onTap: () => _navigateToDrawerDestination(
                      ReportsScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: loc.tr('nav_profile'),
                    onTap: () => _navigateToDrawerDestination(
                      ProfileScreen(auth: widget.auth),
                    ),
                  ),
                  // In-Drawer Language Switcher
                  // Padding(
                  //   padding:
                  //       const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  //   child: ListTile(
                  //     shape: RoundedRectangleBorder(
                  //       borderRadius: BorderRadius.circular(14),
                  //     ),
                  //     leading: const Icon(Icons.translate_rounded,
                  //         color: AppColors.terra, size: 22),
                  //     title: Text(
                  //       loc.isBengali ? 'English-এ দেখুন' : 'বাংলায় দেখুন',
                  //       style: const TextStyle(
                  //         fontWeight: FontWeight.w700,
                  //         fontSize: 14,
                  //       ),
                  //     ),
                  //     trailing: Container(
                  //       padding: const EdgeInsets.symmetric(
                  //           horizontal: 8, vertical: 4),
                  //       decoration: BoxDecoration(
                  //         color: AppColors.terra.withAlpha(25),
                  //         borderRadius: BorderRadius.circular(8),
                  //       ),
                  //       child: Text(
                  //         loc.isBengali ? 'EN' : 'বাং',
                  //         style: const TextStyle(
                  //           fontWeight: FontWeight.w800,
                  //           fontSize: 11,
                  //           color: AppColors.terra,
                  //         ),
                  //       ),
                  //     ),
                  //     onTap: () {
                  //       loc.toggleLanguage();
                  //       Navigator.pop(context);
                  //     },
                  //   ),
                  // ),
                
                ],
              ),
            ),

            // Drawer Footer Sign Out
            Padding(
              padding: const EdgeInsets.all(16),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                leading:
                    const Icon(Icons.logout_rounded, color: AppColors.danger),
                title: Text(
                  loc.tr('nav_sign_out'),
                  style: const TextStyle(
                    color: AppColors.danger,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () async {
                  Navigator.pop(context);
                  await widget.auth.signOut();
                },
              ),
            ),
          ],
        ),
      ),

      // ── Indexed Stack of Main Screens ──────────────────────────────
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),

      bottomNavigationBar: SmartBottomNavBar(
        selectedIndex: _currentIndex,
        onTap: _onBottomNavTapped,
        onCenterTap: () => EntryFormModal.show(
          context,
          financeRepo: widget.financeRepo,
          onEntryCreated: () => setState(() {}),
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        selected: selected,
        selectedTileColor: AppColors.terra.withAlpha(25),
        leading: Icon(
          icon,
          color: selected ? AppColors.terra : null,
          size: 22,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            color: selected ? AppColors.terra : null,
            fontSize: 14,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
