import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Supported locales in Abmiti
enum AppLanguage { en, bn }

/// Localization manager providing reactive language switching and dictionary lookup.
class AppLocale extends ChangeNotifier {
  AppLocale([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage() {
    _loadSavedLanguage();
  }

  final FlutterSecureStorage _storage;
  AppLanguage _currentLanguage = AppLanguage.en;

  AppLanguage get currentLanguage => _currentLanguage;
  bool get isBengali => _currentLanguage == AppLanguage.bn;
  Locale get locale => Locale(isBengali ? 'bn' : 'en');

  Future<void> _loadSavedLanguage() async {
    try {
      final saved = await _storage.read(key: 'app_language');
      if (saved == 'bn') {
        _currentLanguage = AppLanguage.bn;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> setLanguage(AppLanguage language) async {
    if (_currentLanguage == language) return;
    _currentLanguage = language;
    notifyListeners();
    try {
      await _storage.write(
        key: 'app_language',
        value: language == AppLanguage.bn ? 'bn' : 'en',
      );
    } catch (_) {}
  }

  Future<void> toggleLanguage() async {
    final next = isBengali ? AppLanguage.en : AppLanguage.bn;
    await setLanguage(next);
  }

  /// Translate a given key to the active language
  String tr(String key) {
    if (isBengali) {
      return _bn[key] ?? _en[key] ?? key;
    }
    return _en[key] ?? key;
  }

  // ── English Dictionary ─────────────────────────────────────
  static const Map<String, String> _en = {
    // Navigation
    'app_title': 'Abmiti',
    'nav_overview': 'Overview',
    'nav_activity': 'Activity',
    'nav_budgets': 'Budgets',
    'nav_analytics': 'Analytics',
    'nav_categories': 'Categories',
    'nav_reports': 'Monthly Reports',
    'nav_profile': 'Profile & Settings',
    'nav_sign_out': 'Sign Out',

    // Overview
    'net_balance': 'Net Balance',
    'income': 'Income',
    'expenses': 'Expenses',
    'expense': 'Expense',
    'savings': 'Savings',
    'expense_ratio': 'Expense Ratio',
    'monthly_budget': 'Monthly Budget',
    'budget_spent_of': 'spent of',
    'budget_setup_hint': 'Set up your budget to track limits and stay disciplined.',
    'top_categories': 'Top Categories',
    'view_all': 'View All',
    'recent_transactions': 'Recent Transactions',
    'view_ledger': 'View Ledger',
    'no_transactions': 'No transactions yet',
    'no_transactions_hint': 'Tap the + button to log your first expense or income.',
    'add_entry': 'Add Entry',

    // Activity / Ledger
    'filter_all': 'All',
    'filter_expense': 'Expense',
    'filter_income': 'Income',
    'filter_savings': 'Savings',
    'filter_payable': 'Payable',
    'filter_receivable': 'Receivable',
    'filter_investment': 'Investment',
    'no_entries_found': 'No transactions found',
    'no_entries_hint': 'Try selecting a different filter or tap + to add one.',
    'transaction_deleted': 'Transaction deleted',

    // Categories
    'categories_title': 'Categories',
    'new_category': 'New Category',
    'edit_category': 'Edit Category',
    'category_name': 'Category Name',
    'category_name_hint': 'e.g. Groceries, Fuel, Rent',
    'category_type': 'Type',
    'color_tag': 'Color Tag',
    'icon': 'Icon',
    'default_category': 'Default Category',
    'delete_category_confirm': 'Are you sure you want to delete this category? Associated entries will remain intact.',
    'no_categories': 'No categories found',
    'no_categories_hint': 'Add custom categories to personalize your spending logs.',
    'create_category': 'Create Category',

    // Budgets
    'budgets_title': 'Budgets',
    'planned_budget': 'Planned Budget',
    'total_spent': 'Total Spent',
    'remaining': 'Remaining',
    'budget_allocations': 'Budget Allocations',
    'add_line': 'Add Line',
    'add_budget_line': 'Add Budget Line',
    'line_name': 'Line Name',
    'line_name_hint': 'e.g. Housing, Food, Utilities',
    'allocation_method': 'Allocation Method',
    'fixed_amount': 'Fixed Amount (৳)',
    'percentage': 'Percentage (%)',
    'amount': 'Amount',
    'on_track': 'On track',
    'near_threshold': 'Near threshold',
    'exceeded_budget': 'Exceeded budget',
    'used': 'used',
    'no_budget_set': 'No budget set for this month',
    'no_budget_hint': 'Create a monthly budget to set allocation targets and prevent overspending.',
    'create_budget': 'Create Budget',
    'estimated_income': 'Estimated Income',
    'estimated_income_hint': 'Enter your estimated monthly income to start allocating categories:',

    // Analytics
    'analytics_title': 'Financial Analytics',
    'net_growth': 'Net Growth',
    'total_earned': 'Total Earned',
    'total_saved': 'Total Saved',
    'trend_title': 'Annual Income vs Expense Trend',
    'budget_warnings': 'Budget Warnings',

    // Reports
    'report_title': 'Monthly Report',
    'net_savings': 'Net Savings',
    'savings_rate': 'Savings Rate',
    'total_income': 'Total Income',
    'total_expense': 'Total Expense',
    'spending_by_category': 'Spending by Category',
    'of_expenses': 'of expenses',
    'no_data_month': 'No data for this month',
    'no_data_month_hint': 'There are no recorded transactions in this period.',

    // Profile & Settings
    'profile_title': 'Profile & Settings',
    'pro_member': 'PRO MEMBER',
    'free_plan': 'FREE PLAN',
    'unlock_pro': 'Unlock Abmiti Pro',
    'pro_description': 'Get unlimited budget lines, SMS auto-parsing for Bangladesh bank/MFS rails, advanced analytics export, and priority sync.',
    'upgrade_btn': 'Upgrade via SSLCommerz',
    'opening_gateway': 'Opening Gateway...',
    'halal_finance': 'Halal Personal Finance',
    'halal_subtitle': 'No interest, debt traps, or gambling framing',
    'language_switch': 'Language / ভাষা',
    'about_abmiti': 'About Abmiti',
    'sign_out_confirm': 'Are you sure you want to sign out from Abmiti?',

    // Common
    'cancel': 'Cancel',
    'save': 'Save',
    'create': 'Create',
    'delete': 'Delete',
    'try_again': 'Try again',
    'reset': 'Reset',
  };

  // ── Bengali Dictionary ─────────────────────────────────────
  static const Map<String, String> _bn = {
    // Navigation
    'app_title': 'অবমিতি',
    'nav_overview': 'ওভারভিউ',
    'nav_activity': 'লেনদেন',
    'nav_budgets': 'বাজেট',
    'nav_analytics': 'অ্যানালিটিক্স',
    'nav_categories': 'ক্যাটাগরি',
    'nav_reports': 'মাসিক রিপোর্ট',
    'nav_profile': 'প্রোফাইল ও সেটিংস',
    'nav_sign_out': 'লগআউট',

    // Overview
    'net_balance': 'মোট ব্যালেন্স',
    'income': 'আয়',
    'expenses': 'ব্যয়',
    'expense': 'ব্যয়',
    'savings': 'সঞ্চয়',
    'expense_ratio': 'ব্যয়ের অনুপাত',
    'monthly_budget': 'মাসিক বাজেট',
    'budget_spent_of': 'ব্যয় হয়েছে',
    'budget_setup_hint': 'খরচ নিয়ন্ত্রণে রাখতে এবং শৃঙ্খলিত থাকতে বাজেট তৈরি করুন।',
    'top_categories': 'শীর্ষ ক্যাটাগরি',
    'view_all': 'সব দেখুন',
    'recent_transactions': 'সাম্প্রতিক লেনদেন',
    'view_ledger': 'লেজার দেখুন',
    'no_transactions': 'এখনো কোনো লেনদেন নেই',
    'no_transactions_hint': 'প্রথম আয় বা ব্যয়ের হিসাব রাখতে + বাটনে চাপুন।',
    'add_entry': 'নতুন এন্ট্রি',

    // Activity / Ledger
    'filter_all': 'সব',
    'filter_expense': 'ব্যয়',
    'filter_income': 'আয়',
    'filter_savings': 'সঞ্চয়',
    'filter_payable': 'দেনা (পাওনাদার)',
    'filter_receivable': 'পাওনা (দেনাদার)',
    'filter_investment': 'বিনিয়োগ',
    'no_entries_found': 'কোনো লেনদেন পাওয়া যায়নি',
    'no_entries_hint': 'অন্য ফিল্টার বেছে নিন অথবা নতুন এন্ট্রি যোগ করুন।',
    'transaction_deleted': 'লেনদেন মুছে ফেলা হয়েছে',

    // Categories
    'categories_title': 'ক্যাটাগরি সমূহ',
    'new_category': 'নতুন ক্যাটাগরি',
    'edit_category': 'ক্যাটাগরি সম্পাদনা',
    'category_name': 'ক্যাটাগরির নাম',
    'category_name_hint': 'যেমনঃ বাজার, জ্বালানি, বাড়িভাড়া',
    'category_type': 'ধরন',
    'color_tag': 'রঙের ট্যাগ',
    'icon': 'আইকন',
    'default_category': 'ডিফল্ট ক্যাটাগরি',
    'delete_category_confirm': 'আপনি কি নিশ্চিত যে এই ক্যাটাগরি মুছে ফেলতে চান? সংশ্লিষ্ট লেনদেন অপরিবর্তিত থাকবে।',
    'no_categories': 'কোনো ক্যাটাগরি পাওয়া যায়নি',
    'no_categories_hint': 'আপনার ব্যয়ের হিসাব সাজাতে কাস্টম ক্যাটাগরি যোগ করুন।',
    'create_category': 'ক্যাটাগরি তৈরি করুন',

    // Budgets
    'budgets_title': 'মাসিক বাজেট',
    'planned_budget': 'পরিকল্পিত বাজেট',
    'total_spent': 'মোট ব্যয়',
    'remaining': 'অবশিষ্ট',
    'budget_allocations': 'বাজেট বরাদ্দ',
    'add_line': 'লাইন যোগ করুন',
    'add_budget_line': 'নতুন বাজেট লাইন',
    'line_name': 'লাইনের নাম',
    'line_name_hint': 'যেমনঃ বাসস্থান, খাদ্য, বিল',
    'allocation_method': 'বরাদ্দের পদ্ধতি',
    'fixed_amount': 'নির্দিষ্ট পরিমাণ (৳)',
    'percentage': 'শতকরা (%)',
    'amount': 'পরিমাণ',
    'on_track': 'সঠিক পথে আছে',
    'near_threshold': 'সীমার কাছাকাছি',
    'exceeded_budget': 'বাজেট অতিক্রম করেছে',
    'used': 'ব্যবহৃত',
    'no_budget_set': 'এই মাসের জন্য কোনো বাজেট নির্ধারণ করা হয়নি',
    'no_budget_hint': 'অতিরিক্ত খরচ প্রতিরোধ করতে একটি বাজেট পরিকল্পনা তৈরি করুন।',
    'create_budget': 'বাজেট তৈরি করুন',
    'estimated_income': 'আনুমানিক আয়',
    'estimated_income_hint': 'ক্যাটাগরি বরাদ্দের জন্য আপনার আনুমানিক মাসিক আয় লিখুন:',

    // Analytics
    'analytics_title': 'আর্থিক অ্যানালিটিক্স',
    'net_growth': 'নিট সঞ্চয় বৃদ্ধি',
    'total_earned': 'সর্বমোট আয়',
    'total_saved': 'সর্বমোট সঞ্চয়',
    'trend_title': 'বার্ষিক আয় বনাম ব্যয়ের চিত্র',
    'budget_warnings': 'বাজেট সতর্কতা',

    // Reports
    'report_title': 'মাসিক আর্থিক রিপোর্ট',
    'net_savings': 'নিট সঞ্চয়',
    'savings_rate': 'সঞ্চয়ের হার',
    'total_income': 'মোট আয়',
    'total_expense': 'মোট ব্যয়',
    'spending_by_category': 'ক্যাটাগরি ভিত্তিক ব্যয়',
    'of_expenses': 'ব্যয়ের অংশ',
    'no_data_month': 'এই মাসের কোনো তথ্য নেই',
    'no_data_month_hint': 'এই সময়সীমায় কোনো লেনদেন রেকর্ড করা হয়নি।',

    // Profile & Settings
    'profile_title': 'প্রোফাইল ও সেটিংস',
    'pro_member': 'প্রো মেম্বার',
    'free_plan': 'ফ্রি প্ল্যান',
    'unlock_pro': 'অবমিতি প্রো আনলক করুন',
    'pro_description': 'আনলিমিটেড বাজেট লাইন, বিকাশ/নগদ/ব্যাংক এসএমএস অটো-পার্সিং, রিপোর্ট এক্সপোর্ট এবং দ্রুত সিঙ্ক পান।',
    'upgrade_btn': 'SSLCommerz দিয়ে আপগ্রেড করুন',
    'opening_gateway': 'পেমেন্ট গেটওয়ে লোড হচ্ছে...',
    'halal_finance': 'হালাল ব্যক্তিগত অর্থায়ন',
    'halal_subtitle': 'সুদ, ঋণের ফাঁদ এবং জুয়ামুক্ত আর্থিক হিসাব',
    'language_switch': 'Language / ভাষা',
    'about_abmiti': 'অবমিতি সম্পর্কে',
    'sign_out_confirm': 'আপনি কি নিশ্চিত যে অবমিতি থেকে লগআউট করতে চান?',

    // Common
    'cancel': 'বাতিল',
    'save': 'সংরক্ষণ',
    'create': 'তৈরি করুন',
    'delete': 'মুছুন',
    'try_again': 'আবার চেষ্টা করুন',
    'reset': 'রিসেট',
  };
}

/// InheritedWidget or extension to easily access localization in build methods
class LocaleScope extends InheritedNotifier<AppLocale> {
  const LocaleScope({
    super.key,
    required AppLocale locale,
    required super.child,
  }) : super(notifier: locale);

  static AppLocale of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LocaleScope>();
    return scope?.notifier ?? AppLocale();
  }
}

extension LocalizationExtension on BuildContext {
  AppLocale get appLocale => LocaleScope.of(this);
  String tr(String key) => LocaleScope.of(this).tr(key);
}
