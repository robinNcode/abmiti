import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/data/finance_repository.dart';
import '../analytics/analytics_screen.dart';
import '../budgets/budget_screen.dart';
import '../categories/categories_screen.dart';
import '../home/activity_tab.dart';
import '../home/entry_form.dart';
import '../home/overview_tab.dart';
import '../profile/profile_screen.dart';
import '../reports/reports_screen.dart';

/// AppShell provides the core navigation experience:
/// - Responsive Smart Navigation Drawer with user profile header and grouped destinations
/// - BottomNavigationBar for high-frequency screens (Overview, Activity, Budgets, Analytics)
/// - FAB for fast transaction entry
class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    required this.auth,
    required this.financeRepo,
  });

  final AuthRepository auth;
  final FinanceRepository financeRepo;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

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
    final user = widget.auth.currentUser;
    final name = user?['name']?.toString() ?? 'Abmiti User';
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
      'Abmiti',
      'Transactions',
      'Budgets',
      'Analytics',
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
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: 'Categories',
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
            tooltip: 'Profile',
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
                    label: 'Overview',
                    selected: _currentIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 0);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.receipt_long_outlined,
                    label: 'Activity & Ledger',
                    selected: _currentIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 1);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.pie_chart_outline_rounded,
                    label: 'Monthly Budgets',
                    selected: _currentIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 2);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.insights_rounded,
                    label: 'Financial Analytics',
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
                    label: 'Categories',
                    onTap: () => _navigateToDrawerDestination(
                      CategoriesScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.assessment_outlined,
                    label: 'Monthly Reports',
                    onTap: () => _navigateToDrawerDestination(
                      ReportsScreen(financeRepo: widget.financeRepo),
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: 'Profile & Settings',
                    onTap: () => _navigateToDrawerDestination(
                      ProfileScreen(auth: widget.auth),
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
                leading: const Icon(Icons.logout_rounded, color: AppColors.danger),
                title: const Text(
                  'Sign Out',
                  style: TextStyle(
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

      // ── Modern Floating Action Button ──────────────────────────────
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                EntryFormModal.show(
                  context,
                  financeRepo: widget.financeRepo,
                  onEntryCreated: () => setState(() {}),
                );
              },
              icon: const Icon(Icons.add_rounded),
              label: const Text(
                'Add Entry',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            )
          : null,

      // ── Modern Navigation Bar ──────────────────────────────────────
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _onBottomNavTapped,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded, color: AppColors.terra),
            label: 'Overview',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon:
                Icon(Icons.receipt_long_rounded, color: AppColors.terra),
            label: 'Activity',
          ),
          NavigationDestination(
            icon: Icon(Icons.pie_chart_outline_rounded),
            selectedIcon:
                Icon(Icons.pie_chart_rounded, color: AppColors.terra),
            label: 'Budgets',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights_rounded, color: AppColors.terra),
            label: 'Analytics',
          ),
        ],
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
