import 'package:flutter/material.dart';
import 'package:curved_labeled_navigation_bar/curved_navigation_bar.dart';
import 'package:curved_labeled_navigation_bar/curved_navigation_bar_item.dart';

import '../../core/config/app_config.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/data/finance_repository.dart';
import '../analytics/analytics_screen.dart';
import '../budgets/budget_screen.dart';
import '../categories/categories_screen.dart';
import '../home/activity_tab.dart';
import '../home/entry_form.dart';
import '../home/overview_tab.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
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

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;
  int _unreadNotifications = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  String? get _userId {
    final user = widget.auth.currentUser;
    return (user?['_id'] ?? user?['id'])?.toString();
  }

  @override
  void initState() {
    super.initState();
    _refreshUnreadCount();
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

  void _navigateToDrawerDestination(Widget screen) {
    Navigator.pop(context); // close drawer
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;
    final user = widget.auth.currentUser;
    final name = user?['name']?.toString() ?? loc.tr('default_user_name');
    final email = user?['email']?.toString() ?? '';

    final pages = [
      OverviewTab(
        financeRepo: widget.financeRepo,
        auth: widget.auth,
        onNavigateToLedger: () => setState(() => _currentIndex = 1),
        onNavigateToBudgets: () => setState(() => _currentIndex = 2),
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
              padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'A',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppColors.terra,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    email,
                    style: TextStyle(
                      color: Colors.white.withAlpha(200),
                      fontSize: 12,
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
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      leading: const Icon(Icons.translate_rounded,
                          color: AppColors.terra, size: 22),
                      title: Text(
                        loc.isBengali ? 'English-এ দেখুন' : 'বাংলায় দেখুন',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.terra.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          loc.isBengali ? 'EN' : 'বাং',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            color: AppColors.terra,
                          ),
                        ),
                      ),
                      onTap: () {
                        loc.toggleLanguage();
                        Navigator.pop(context);
                      },
                    ),
                  ),
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

      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: _currentIndex == 0
          ? Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: FloatingActionButton(
                onPressed: () {
                  EntryFormModal.show(
                    context,
                    financeRepo: widget.financeRepo,
                    onEntryCreated: () => setState(() {}),
                  );
                },
                backgroundColor: AppColors.terra,
                foregroundColor: Colors.white,
                elevation: 8,
                shape: const CircleBorder(),
                child: const Icon(Icons.add_rounded, size: 30),
              ),
            )
          : null,

      // ── Curved Bottom Navigation Bar ───────────────────────────────
      bottomNavigationBar: CurvedNavigationBar(
        index: _currentIndex,
        height: 58,
        backgroundColor: Colors.transparent,
        color: isDark ? AppColors.darkSurface : AppColors.paperCard,
        buttonBackgroundColor: AppColors.terra,
        items: [
          CurvedNavigationBarItem(
            child: Icon(
              Icons.dashboard_rounded,
              size: 22,
              color: _currentIndex == 0
                  ? Colors.white
                  : (isDark ? Colors.white70 : AppColors.ink),
            ),
          ),
          CurvedNavigationBarItem(
            child: Icon(
              Icons.receipt_long_rounded,
              size: 22,
              color: _currentIndex == 1
                  ? Colors.white
                  : (isDark ? Colors.white70 : AppColors.ink),
            ),
          ),
          CurvedNavigationBarItem(
            child: Icon(
              Icons.pie_chart_rounded,
              size: 22,
              color: _currentIndex == 2
                  ? Colors.white
                  : (isDark ? Colors.white70 : AppColors.ink),
            ),
          ),
          CurvedNavigationBarItem(
            child: Icon(
              Icons.insights_rounded,
              size: 22,
              color: _currentIndex == 3
                  ? Colors.white
                  : (isDark ? Colors.white70 : AppColors.ink),
            ),
          ),
        ],
        onTap: _onBottomNavTapped,
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
