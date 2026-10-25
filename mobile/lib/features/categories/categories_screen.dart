import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/shimmer_loading.dart';
import 'category_form.dart';

/// Categories management screen with filter by type and full CRUD operations.
class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({
    super.key,
    required this.financeRepo,
  });

  final FinanceRepository financeRepo;

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final List<String> _types = const [
    'expense',
    'income',
    'savings',
    'payable',
    'receivable',
  ];

  List<Map<String, dynamic>> _categories = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _types.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadCategories();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final currentType = _types[_tabController.index];
      final list = await widget.financeRepo.fetchCategories(type: currentType);
      if (mounted) {
        setState(() {
          _categories = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = ApiClient.messageFrom(e);
          _loading = false;
        });
      }
    }
  }

  Future<void> _deleteCategory(String id) async {
    final loc = context.appLocale;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(loc.tr('delete_category')),
        content: Text(loc.tr('delete_category_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(loc.tr('cancel')),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(loc.tr('delete')),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await widget.financeRepo.deleteCategory(id);
      _loadCategories();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(loc.tr('category_deleted'))),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiClient.messageFrom(e))),
        );
      }
    }
  }

  Color _hexToColor(String? hex) {
    if (hex == null || hex.isEmpty) return AppColors.terra;
    final buffer = StringBuffer();
    if (hex.length == 6 || hex.length == 7) buffer.write('ff');
    buffer.write(hex.replaceFirst('#', ''));
    try {
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return AppColors.terra;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('categories_title'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.terra,
          indicatorWeight: 3,
          labelColor: AppColors.terra,
          unselectedLabelColor:
              isDark ? AppColors.darkMuted : AppColors.inkLight,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          tabs: [
            Tab(text: loc.tr('filter_expense')),
            Tab(text: loc.tr('filter_income')),
            Tab(text: loc.tr('filter_savings')),
            Tab(text: loc.tr('filter_payable')),
            Tab(text: loc.tr('filter_receivable')),
          ],
        ),
      ),
      body: _loading
          ? const SingleChildScrollView(
              padding: EdgeInsets.all(20),
              child: ShimmerLoading(count: 5),
            )
          : _error != null
              ? ErrorState(
                  message: _error!,
                  onRetry: _loadCategories,
                )
              : _categories.isEmpty
                  ? EmptyState(
                      icon: Icons.category_outlined,
                      title: loc.tr('no_categories'),
                      subtitle: loc.tr('no_categories_hint'),
                      actionLabel: loc.tr('create_category'),
                      action: () {
                        CategoryFormDialog.show(
                          context,
                          financeRepo: widget.financeRepo,
                          onSaved: _loadCategories,
                        );
                      },
                    )
                  : RefreshIndicator(
                      onRefresh: _loadCategories,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 80),
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final c = _categories[index];
                          final id = c['_id']?.toString() ?? '';
                          final name = c['name']?.toString() ?? 'Category';
                          final isDefault = c['isDefault'] == true;
                          final color = _hexToColor(c['color']?.toString());

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.darkElevated
                                  : AppColors.paperCard,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark
                                    ? AppColors.darkBorder
                                    : AppColors.pastelApricot.withAlpha(120),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      Colors.black.withAlpha(isDark ? 25 : 8),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 42,
                                  height: 42,
                                  decoration: BoxDecoration(
                                    color: color.withAlpha(35),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: color.withAlpha(80),
                                      width: 1,
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.label_rounded,
                                    color: color,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                        ),
                                      ),
                                      if (isDefault)
                                        Text(
                                          loc.tr('default_category'),
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isDark
                                                ? AppColors.darkMuted
                                                : AppColors.inkLight,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon:
                                      const Icon(Icons.edit_outlined, size: 20),
                                  onPressed: () {
                                    CategoryFormDialog.show(
                                      context,
                                      financeRepo: widget.financeRepo,
                                      existingCategory: c,
                                      onSaved: _loadCategories,
                                    );
                                  },
                                ),
                                if (!isDefault)
                                  IconButton(
                                    icon: const Icon(
                                      Icons.delete_outline_rounded,
                                      size: 20,
                                      color: AppColors.danger,
                                    ),
                                    onPressed: () => _deleteCategory(id),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          CategoryFormDialog.show(
            context,
            financeRepo: widget.financeRepo,
            onSaved: _loadCategories,
          );
        },
        child: const Icon(Icons.add_rounded),
      ),
    );
  }
}
