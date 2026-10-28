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

  /// Full month name (1-12) in the active language.
  String monthName(int month) => tr('month_$month');

  /// Abbreviated month name (1-12) in the active language.
  String monthShort(int month) => tr('month_short_$month');

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
    'total_balance': 'Total Balance',
    'net_balance': 'Net Balance',
    'income': 'Income',
    'expenses': 'Expenses',
    'expense': 'Expense',
    'savings': 'Savings',
    'expense_ratio': 'Expense Ratio',
    'monthly_budget': 'Monthly Budget',
    'budget_spent_of': 'spent of',
    'budget_setup_hint':
        'Set up your budget to track limits and stay disciplined.',
    'top_categories': 'Top Categories',
    'view_all': 'View All',
    'recent_transactions': 'Recent Transactions',
    'view_ledger': 'View Ledger',
    'no_transactions': 'No transactions yet',
    'no_transactions_hint':
        'Tap the + button to log your first expense or income.',
    'dashboard_load_error': 'Failed to load dashboard data. Please try again.',
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
    'category_name_required': 'Please enter a category name',
    'category_type': 'Type',
    'color_tag': 'Color Tag',
    'icon': 'Icon',
    'default_category': 'Default Category',
    'delete_category_confirm':
        'Are you sure you want to delete this category? Associated entries will remain intact.',
    'no_categories': 'No categories found',
    'no_categories_hint':
        'Add custom categories to personalize your spending logs.',
    'create_category': 'Create Category',
    'delete_category': 'Delete Category',
    'category_deleted': 'Category deleted',

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
    'no_budget_hint':
        'Create a monthly budget to set allocation targets and prevent overspending.',
    'create_budget': 'Create Budget',
    'estimated_income': 'Estimated Income',
    'estimated_income_hint':
        'Enter your estimated monthly income to start allocating categories:',
    'edit_estimated_income': 'Edit Estimated Income',
    'edit_income_hint':
        'Update the monthly income your budget allocations are based on.',
    'edit_budget_line': 'Edit Budget Line',
    'edit_line': 'Edit Line',
    'delete_line': 'Delete Line',
    'amount_bdt': 'Amount (৳)',
    'percent_sign': 'Percent (%)',
    'add': 'Add',
    'no_budget_lines': 'No budget lines yet',
    'no_budget_lines_hint':
        'Tap "+ Add Line" above to split your monthly budget into categories.',

    // Analytics
    'analytics_title': 'Financial Analytics',
    'net_growth': 'Net Growth',
    'total_earned': 'Total Earned',
    'total_saved': 'Total Saved',
    'trend_title': 'Annual Income vs Expense Trend',
    'budget_warnings': 'Budget Warnings',
    'budget_warning_default': 'One of your budgets has exceeded threshold.',
    'income_label': 'Income:',
    'expense_label': 'Expense:',

    // Month names
    'month_1': 'January',
    'month_2': 'February',
    'month_3': 'March',
    'month_4': 'April',
    'month_5': 'May',
    'month_6': 'June',
    'month_7': 'July',
    'month_8': 'August',
    'month_9': 'September',
    'month_10': 'October',
    'month_11': 'November',
    'month_12': 'December',
    'month_short_1': 'J',
    'month_short_2': 'F',
    'month_short_3': 'M',
    'month_short_4': 'A',
    'month_short_5': 'M',
    'month_short_6': 'J',
    'month_short_7': 'J',
    'month_short_8': 'A',
    'month_short_9': 'S',
    'month_short_10': 'O',
    'month_short_11': 'N',
    'month_short_12': 'D',

    // Reports
    'report_title': 'Monthly Report',
    'net_savings': 'Net Savings',
    'savings_rate': 'Savings Rate',
    'total_income': 'Total Income',
    'total_expense': 'Total Expense',
    'spending_by_category': 'Spending by Category',
    'of_expenses': 'of expenses',
    'no_categorized_expenses': 'No categorized expenses for this month.',
    'no_data_month': 'No data for this month',
    'no_data_month_hint': 'There are no recorded transactions in this period.',

    // Profile & Settings
    'profile_title': 'Profile & Settings',
    'pro_member': 'PRO MEMBER',
    'free_plan': 'FREE PLAN',
    'unlock_pro': 'Unlock Abmiti Pro',
    'pro_description':
        'Get unlimited budget lines, SMS auto-parsing for Bangladesh bank/MFS rails, advanced analytics export, and priority sync.',
    'upgrade_btn': 'Upgrade via SSLCommerz',
    'opening_gateway': 'Opening Gateway...',
    'halal_finance': 'Halal Personal Finance',
    'halal_subtitle': 'No interest, debt traps, or gambling framing',
    'language_switch': 'Language / ভাষা',
    'about_abmiti': 'About Abmiti',
    'about_version': 'v1.1.0 • Made with ❤️ for Bangladesh',
    'sign_out': 'Sign Out',
    'theme_setting': 'Theme / থিম',
    'theme_device': 'Device',
    'theme_device_desc': 'Match system appearance',
    'theme_light': 'Light',
    'theme_light_desc': 'Always use light theme',
    'theme_dark': 'Dark',
    'theme_dark_desc': 'Always use dark theme',
    'select_theme': 'Choose Theme / থিম নির্বাচন',
    'valid_until': 'Valid until: {n}',
    'sign_out_confirm': 'Are you sure you want to sign out from Abmiti?',

    // Notifications
    'notifications_title': 'Notifications',
    'api_server': 'API Server',
    'default_user_name': 'Abmiti User',
    'mark_all_read': 'Mark all read',
    'notification_fallback': 'Notification',
    'no_notifications': 'No notifications yet',
    'no_notifications_hint':
        'Plan reminders, budget warnings and account updates appear here.',
    'time_just_now': 'Just now',
    'time_minutes_ago': '{n}m ago',
    'time_hours_ago': '{n}h ago',
    'time_days_ago': '{n}d ago',

    // API environment switcher
    'api_env_title': 'API Environment & Network',
    'api_env_subtitle':
        'Switch between different routers, same router (LAN), or production without rebuilding.',
    'lan_ip_label': 'Ubuntu PC LAN IP',
    'lan_ip_helper': 'Find with "ip addr" on Ubuntu. Port 5000 is used.',
    'custom_url_label': 'Custom API URL / Tunnel',
    'custom_url_helper': 'Localtunnel, Cloudflare tunnel, or Ngrok URL',
    'usb_hint':
        'Ensure USB debugging is enabled and run on PC:\nadb reverse tcp:5000 tcp:5000',
    'testing': 'Testing...',
    'test_ping': 'Test Ping',
    'apply_url': 'Apply URL',
    'switched_api': 'Switched API to: {n}',
    'env_different_router_usb': 'Different Router (USB / ADB)',
    'env_different_router_usb_desc':
        'PC & Phone on different routers; connected via USB cable (adb reverse)',
    'env_same_router_lan': 'Same Router (LAN IP)',
    'env_same_router_lan_desc':
        'PC & Phone on same Wi-Fi / subnet (PC IP: 192.168.26.65:5000)',
    'env_production': 'Production',
    'env_production_desc': 'Live production server (voltwavebd.com)',
    'env_custom': 'Custom URL / Tunnel',
    'env_custom_desc':
        'Public HTTPS tunnel (localtunnel / ngrok) or manual URL',

    // Shared widgets
    'personal_finance': 'Personal Finance',
    'offline_title': 'No internet connection',
    'offline_subtitle': 'Check your network connection and try again.',
    'retrying': 'Retrying...',
    'ring_over': 'Over',
    'ring_used': 'Used',

    // Entry form
    'new_entry_title': 'New Entry',
    'edit_entry': 'Edit Entry',
    'entry_type_fixed': 'Entry type cannot be changed after it is saved.',
    'amount_invalid': 'Please enter a valid amount',
    'category_required': 'Select a category for this entry',
    'category': 'Category',
    'no_categories_for_type': 'No categories available for this type.',
    'date': 'Date',
    'payment_source': 'Payment Source',
    'source_cash': 'Cash',
    'source_bank': 'Bank Transfer',
    'source_bkash': 'bKash',
    'source_nagad': 'Nagad',
    'source_card': 'Card',
    'source_other': 'Other',
    'note_optional': 'Note (Optional)',
    'note_hint': 'e.g. Grocery, Lunch, Rent',
    'save_changes': 'Save Changes',

    // Auth
    'auth_welcome': 'Welcome to Abmiti',
    'auth_welcome_sub': 'Your money, in balance.',
    'auth_register_headline': 'Start with clarity',
    'auth_register_sub':
        'Create your account and build healthier money habits.',
    'auth_full_name': 'Full name',
    'auth_name_error': 'Enter your name (up to 80 characters)',
    'auth_email': 'Email address',
    'auth_email_error': 'Enter a valid email address',
    'auth_password': 'Password',
    'auth_password_error': 'Use at least 6 characters',
    'auth_sign_in': 'Sign in',
    'auth_create_account': 'Create account',
    'auth_have_account': 'Already have an account? Sign in',
    'auth_no_account': 'New to Abmiti? Create an account',
    'auth_continue_google': 'Continue with Google',
    'or_divider': 'OR',

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
    'total_balance': 'মোট ব্যালেন্স',
    'net_balance': 'নিট ব্যালেন্স',
    'income': 'আয়',
    'expenses': 'ব্যয়',
    'expense': 'ব্যয়',
    'savings': 'সঞ্চয়',
    'expense_ratio': 'ব্যয়ের অনুপাত',
    'monthly_budget': 'মাসিক বাজেট',
    'budget_spent_of': 'ব্যয় হয়েছে',
    'budget_setup_hint':
        'খরচ নিয়ন্ত্রণে রাখতে এবং শৃঙ্খলিত থাকতে বাজেট তৈরি করুন।',
    'top_categories': 'শীর্ষ ক্যাটাগরি',
    'view_all': 'সব দেখুন',
    'recent_transactions': 'সাম্প্রতিক লেনদেন',
    'view_ledger': 'লেজার দেখুন',
    'no_transactions': 'এখনো কোনো লেনদেন নেই',
    'no_transactions_hint': 'প্রথম আয় বা ব্যয়ের হিসাব রাখতে + বাটনে চাপুন।',
    'dashboard_load_error':
        'ড্যাশবোর্ডের তথ্য আনা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
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
    'category_name_required': 'অনুগ্রহ করে ক্যাটাগরির নাম লিখুন',
    'category_type': 'ধরন',
    'color_tag': 'রঙের ট্যাগ',
    'icon': 'আইকন',
    'default_category': 'ডিফল্ট ক্যাটাগরি',
    'delete_category_confirm':
        'আপনি কি নিশ্চিত যে এই ক্যাটাগরি মুছে ফেলতে চান? সংশ্লিষ্ট লেনদেন অপরিবর্তিত থাকবে।',
    'no_categories': 'কোনো ক্যাটাগরি পাওয়া যায়নি',
    'no_categories_hint':
        'আপনার ব্যয়ের হিসাব সাজাতে কাস্টম ক্যাটাগরি যোগ করুন।',
    'create_category': 'ক্যাটাগরি তৈরি করুন',
    'delete_category': 'ক্যাটাগরি মুছুন',
    'category_deleted': 'ক্যাটাগরি মুছে ফেলা হয়েছে',

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
    'no_budget_hint':
        'অতিরিক্ত খরচ প্রতিরোধ করতে একটি বাজেট পরিকল্পনা তৈরি করুন।',
    'create_budget': 'বাজেট তৈরি করুন',
    'estimated_income': 'আনুমানিক আয়',
    'estimated_income_hint':
        'ক্যাটাগরি বরাদ্দের জন্য আপনার আনুমানিক মাসিক আয় লিখুন:',
    'edit_estimated_income': 'আনুমানিক আয় সম্পাদনা',
    'edit_income_hint':
        'আপনার বাজেট বরাদ্দের ভিত্তি হিসেববর্তী মাসিক আয় পরিবর্তন করুন।',
    'edit_budget_line': 'বাজেট লাইন সম্পাদনা',
    'edit_line': 'লাইন সম্পাদনা',
    'delete_line': 'লাইন মুছুন',
    'amount_bdt': 'পরিমাণ (৳)',
    'percent_sign': 'শতকরা (%)',
    'add': 'যোগ করুন',
    'no_budget_lines': 'এখনো কোনো বাজেট লাইন নেই',
    'no_budget_lines_hint':
        'মাসিক বাজেটকে ক্যাটাগরিতে ভাগ করতে উপরে "+ লাইন যোগ করুন"-এ চাপুন।',

    // Analytics
    'analytics_title': 'আর্থিক অ্যানালিটিক্স',
    'net_growth': 'নিট সঞ্চয় বৃদ্ধি',
    'total_earned': 'সর্বমোট আয়',
    'total_saved': 'সর্বমোট সঞ্চয়',
    'trend_title': 'বার্ষিক আয় বনাম ব্যয়ের চিত্র',
    'budget_warnings': 'বাজেট সতর্কতা',
    'budget_warning_default': 'আপনার একটি বাজেট সীমা অতিক্রম করেছে।',
    'income_label': 'আয়:',
    'expense_label': 'ব্যয়:',

    // Month names
    'month_1': 'জানুয়ারি',
    'month_2': 'ফেব্রুয়ারি',
    'month_3': 'মার্চ',
    'month_4': 'এপ্রিল',
    'month_5': 'মে',
    'month_6': 'জুন',
    'month_7': 'জুলাই',
    'month_8': 'আগস্ট',
    'month_9': 'সেপ্টেম্বর',
    'month_10': 'অক্টোবর',
    'month_11': 'নভেম্বর',
    'month_12': 'ডিসেম্বর',
    'month_short_1': 'জানু',
    'month_short_2': 'ফেব্রু',
    'month_short_3': 'মার্চ',
    'month_short_4': 'এপ্রি',
    'month_short_5': 'মে',
    'month_short_6': 'জুন',
    'month_short_7': 'জুলা',
    'month_short_8': 'আগ',
    'month_short_9': 'সেপ্ট',
    'month_short_10': 'অক্টো',
    'month_short_11': 'নভে',
    'month_short_12': 'ডিসে',

    // Reports
    'report_title': 'মাসিক আর্থিক রিপোর্ট',
    'net_savings': 'নিট সঞ্চয়',
    'savings_rate': 'সঞ্চয়ের হার',
    'total_income': 'মোট আয়',
    'total_expense': 'মোট ব্যয়',
    'spending_by_category': 'ক্যাটাগরি ভিত্তিক ব্যয়',
    'of_expenses': 'ব্যয়ের অংশ',
    'no_categorized_expenses': 'এই মাসে কোনো ক্যাটাগরিভুক্ত ব্যয় নেই।',
    'no_data_month': 'এই মাসের কোনো তথ্য নেই',
    'no_data_month_hint': 'এই সময়সীমায় কোনো লেনদেন রেকর্ড করা হয়নি।',

    // Profile & Settings
    'profile_title': 'প্রোফাইল ও সেটিংস',
    'pro_member': 'প্রো মেম্বার',
    'free_plan': 'ফ্রি প্ল্যান',
    'unlock_pro': 'অবমিতি প্রো আনলক করুন',
    'pro_description':
        'আনলিমিটেড বাজেট লাইন, বিকাশ/নগদ/ব্যাংক এসএমএস অটো-পার্সিং, রিপোর্ট এক্সপোর্ট এবং দ্রুত সিঙ্ক পান।',
    'upgrade_btn': 'SSLCommerz দিয়ে আপগ্রেড করুন',
    'opening_gateway': 'পেমেন্ট গেটওয়ে লোড হচ্ছে...',
    'halal_finance': 'হালাল ব্যক্তিগত অর্থায়ন',
    'halal_subtitle': 'সুদ, ঋণের ফাঁদ এবং জুয়ামুক্ত আর্থিক হিসাব',
    'language_switch': 'Language / ভাষা',
    'about_abmiti': 'অবমিতি সম্পর্কে',
    'about_version': 'ভার্সন ১.১.০ • বাংলাদেশের জন্য ❤️ দিয়ে তৈরি',
    'sign_out': 'লগআউট',
    'theme_setting': 'Theme / থিম',
    'theme_device': 'সিস্টেম (Device)',
    'theme_device_desc': 'ডিভাইসের থিম অনুযায়ী চলবে',
    'theme_light': 'লাইট (Light)',
    'theme_light_desc': 'সর্বদা হালকা থিম ব্যবহৃত হবে',
    'theme_dark': 'ডার্ক (Dark)',
    'theme_dark_desc': 'সর্বদা ডার্ক থিম ব্যবহৃত হবে',
    'select_theme': 'Choose Theme / থিম নির্বাচন',
    'valid_until': 'বৈধ পর্যন্ত: {n}',
    'sign_out_confirm': 'আপনি কি নিশ্চিত যে অবমিতি থেকে লগআউট করতে চান?',

    // Notifications
    'notifications_title': 'বিজ্ঞপ্তি',
    'api_server': 'API সার্ভার',
    'default_user_name': 'অবমিতি ব্যবহারকারী',
    'mark_all_read': 'সব পড়া হয়েছে',
    'notification_fallback': 'বিজ্ঞপ্তি',
    'no_notifications': 'এখনো কোনো বিজ্ঞপ্তি নেই',
    'no_notifications_hint':
        'বাজেট পরিকল্পনা, বাজেট সতর্কতা ও অ্যাকাউন্ট আপডেট এখানে দেখা যাবে।',
    'time_just_now': 'এইমাত্র',
    'time_minutes_ago': '{n} মিনিট আগে',
    'time_hours_ago': '{n} ঘণ্টা আগে',
    'time_days_ago': '{n} দিন আগে',

    // API environment switcher
    'api_env_title': 'API পরিবেশ ও নেটওয়ার্ক',
    'api_env_subtitle':
        'রিবিল্ড ছাড়াই বিভিন্ন রাউটার, একই রাউটার (LAN) বা প্রোডাকশনের মধ্যে পরিবর্তন করুন।',
    'lan_ip_label': 'উবুন্টু পিসির LAN IP',
    'lan_ip_helper':
        'উবুন্টুতে "ip addr" দিয়ে খুঁজুন। পোর্ট 5000 ব্যবহৃত হয়।',
    'custom_url_label': 'কাস্টম API URL / টানেল',
    'custom_url_helper': 'Localtunnel, Cloudflare tunnel বা Ngrok URL',
    'usb_hint':
        'USB ডিবাগিং চালু আছে নিশ্চিত করুন এবং পিসিতে চালান:\nadb reverse tcp:5000 tcp:5000',
    'testing': 'পরীক্ষা চলছে...',
    'test_ping': 'পিং পরীক্ষা',
    'apply_url': 'URL প্রয়োগ করুন',
    'switched_api': 'API পরিবর্তন করা হয়েছে: {n}',
    'env_different_router_usb': 'বিভিন্ন রাউটার (USB / ADB)',
    'env_different_router_usb_desc':
        'পিসি ও ফোন বিভিন্ন রাউটারে; USB কেবল দিয়ে সংযুক্ত (adb reverse)',
    'env_same_router_lan': 'একই রাউটার (LAN IP)',
    'env_same_router_lan_desc':
        'পিসি ও ফোন একই ওয়াইফাই/সাবনেটে (পিসি IP: 192.168.26.65:5000)',
    'env_production': 'প্রোডাকশন',
    'env_production_desc': 'লাইভ প্রোডাকশন সার্ভার (voltwavebd.com)',
    'env_custom': 'কাস্টম URL / টানেল',
    'env_custom_desc':
        'পাবলিক HTTPS টানেল (localtunnel / ngrok) বা ম্যানুয়াল URL',

    // Shared widgets
    'personal_finance': 'ব্যক্তিগত অর্থায়ন',
    'offline_title': 'ইন্টারনেট সংযোগ নেই',
    'offline_subtitle':
        'আপনার নেটওয়ার্ক সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
    'retrying': 'পুনরায় চেষ্টা করা হচ্ছে...',
    'ring_over': 'অতিক্রম',
    'ring_used': 'ব্যবহৃত',

    // Entry form
    'new_entry_title': 'নতুন এন্ট্রি',
    'edit_entry': 'এন্ট্রি সম্পাদনা',
    'entry_type_fixed': 'সংরক্ষণের পর এন্ট্রির ধরন পরিবর্তন করা যাবে না।',
    'amount_invalid': 'সঠিক পরিমাণ লিখুন',
    'category_required': 'এই এন্ট্রির জন্য একটি ক্যাটাগরি বেছে নিন',
    'category': 'ক্যাটাগরি',
    'no_categories_for_type': 'এই ধরনের জন্য কোনো ক্যাটাগরি নেই।',
    'date': 'তারিখ',
    'payment_source': 'পেমেন্ট উৎস',
    'source_cash': 'নগদ',
    'source_bank': 'ব্যাংক ট্রান্সফার',
    'source_bkash': 'বিকাশ',
    'source_nagad': 'নগদ (Nagad)',
    'source_card': 'কার্ড',
    'source_other': 'অন্যান্য',
    'note_optional': 'নোট (ঐচ্ছিক)',
    'note_hint': 'যেমনঃ বাজার, দুপুরের খাবার, ভাড়া',
    'save_changes': 'পরিবর্তন সংরক্ষণ করুন',

    // Auth
    'auth_welcome': 'অবমিতিতে স্বাগতম',
    'auth_welcome_sub': 'আপনার টাকা, ভারসাম্যে।',
    'auth_register_headline': 'স্পষ্টতা দিয়ে শুরু করুন',
    'auth_register_sub':
        'অ্যাকাউন্ট তৈরি করুন এবং সুস্থ অর্থসংস্থানের অভ্যাস গড়ে তুলুন।',
    'auth_full_name': 'পুরো নাম',
    'auth_name_error': 'আপনার নাম লিখুন (সর্বোচ্চ ৮০ অক্ষর)',
    'auth_email': 'ইমেইল ঠিকানা',
    'auth_email_error': 'সঠিক ইমেইল ঠিকানা লিখুন',
    'auth_password': 'পাসওয়ার্ড',
    'auth_password_error': 'কমপক্ষে ৬ অক্ষর ব্যবহার করুন',
    'auth_sign_in': 'সাইন ইন',
    'auth_create_account': 'অ্যাকাউন্ট তৈরি করুন',
    'auth_have_account': 'ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন',
    'auth_no_account': 'নতুন অবমিতিতে? অ্যাকাউন্ট তৈরি করুন',
    'auth_continue_google': 'গুগল দিয়ে চালিয়ে যান',
    'or_divider': 'অথবা',

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
