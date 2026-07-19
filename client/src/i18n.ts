import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      Dashboard: 'Dashboard',
      entries: 'Entries',
      Entries: 'Entries',
      analytics: 'Analytics',
      Analytics: 'Analytics',
      categories: 'Categories',
      Categories: 'Categories',
      Budget: 'Budget',
      Investments: 'Investments',
      Settings: 'Settings',
      Period: 'Period',
      'Sign out': 'Sign out',
      signOut: 'Sign out',

      // Common
      period: 'Period',
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      savings: 'Savings',
      payable: 'Payable',
      receivable: 'Receivable',
      add: 'Add',

      // Entries
      entriesTitle: 'Entries',
      addIncome: 'Add Income',
      addExpense: 'Add Expense',
      addInvestments: 'Add Investments',
      addSavings: 'Add Savings',
      addPayable: 'Add Payable',
      addReceivable: 'Add Receivable',
      noEntries: 'No entries found',
      noEntriesSubtitle: 'Try changing filters or add a new entry',
      monthlyEntries: 'entries this month',

      // Investments
      investments: 'Investments',
      trackYourInvestmentEntries: 'Track your investment entries',
      addInvestment: 'Add Investment',
      noInvestmentsYet: 'No investments yet',
      addYourFirstInvestmentEntry: 'Add your first investment entry to see it on the dashboard',

      // Budget
      budgetSubtitle: 'Plan monthly income, allocations, and category spending.',
      monthlyBudget: 'Monthly Budget',
      monthlyBudgetSubtitle: 'Your budget helps the dashboard show remaining budget and investment impact.',
      monthlyBudgetInputPlaceholder: 'Enter your monthly budget',
      monthlyBudgetLabel: 'Monthly budget (BDT)',
      budgetLines: 'Budget Lines',

      // Modals
      addIncomeTitle: 'Add Income',
      addExpenseTitle: 'Add Expense',
      addSavingsTitle: 'Add Savings',
      addPayableTitle: 'Add Payable',
      addReceivableTitle: 'Add Receivable',

      // Forms
      amount: 'Amount',
      note: 'Note',
      category: 'Category',
      source: 'Source',
      account: 'Account',
      date: 'Date',
      sms: 'SMS',
      parseSms: 'Parse SMS',
      submit: 'Submit',
      cancel: 'Cancel',

      // Auth
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      confirmPassword: 'Confirm Password',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',

      // Dashboard
      totalIncome: 'Total Income',
      budget: 'Budget',
      budgetHealth: 'Budget Health',
      planned: 'Planned',
      spent: 'Spent',
      remaining: 'Remaining',
      allocated: 'Allocated',
      totalExpense: 'Total Expense',
      totalSavings: 'Total Savings',
      netSavings: 'Net Savings',
      savingsRate: 'Savings Rate',

      // Analytics
      yearlyTrend: 'Yearly Trend',
      categoryBreakdown: 'Category Breakdown',

      // Categories Page
      manageCategories: 'Manage Categories',
      addCategory: 'Add Category',
      categoryName: 'Category Name',
      categoryType: 'Category Type',
      newCategory: 'New Category',
      icon: 'Icon',
      color: 'Color',
      default: 'Default',
      custom: 'Custom',
      createCategory: 'Create Category',
      groceries: 'Groceries',
      ExpenseCategory: 'Expense Category',
      IncomeCategory: 'Income Category',
      noCategories: 'No Categories',

      // Sources
      bank: 'Bank',
      bkash: 'bKash',
      nagad: 'Nagad',
      cash: 'Cash',
      card: 'Card',
      other: 'Other',

      // Report Page
      reportTitle: 'Report',
      reportSubtitle: 'View your monthly income, expense, and savings report',
      monthlyReport: 'Monthly Report',
      monthlyReportSubtitle: 'View your monthly income, expense, and savings report',
      categoryReport: 'Category Report',
      categoryReportSubtitle: 'View your category-wise income, expense, and savings report',

      // Settings Page
      settings: 'Settings',
      settingsSubtitle: 'Set your monthly budget and profile preferences',
      language: 'Language',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      system: 'System',
      save: 'Save',
      logout: 'Logout',
      deleteAccount: 'Delete Account',
      deleteAccountConfirm: 'Are you sure you want to delete your account?',
      deleteAccountConfirmation: 'This action cannot be undone. All your data will be permanently removed. Proceed?',
      deleteAccountConfirmationTitle: 'Delete Account',
      deleteAccountConfirmationMessage: 'This action cannot be undone. All your data will be permanently removed. Proceed?',
      deleteAccountConfirmationButton: 'Delete Account',
      deleteAccountConfirmationButtonText: 'Delete Account',
    },
  },


  // Bengali translations ........................................................
  bn: {
    translation: {
      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      Dashboard: 'ড্যাশবোর্ড',
      entries: 'এন্ট্রি',
      Entries: 'এন্ট্রি',
      analytics: 'অ্যানালিটিক্স',
      Analytics: 'অ্যানালিটিক্স',
      categories: 'ক্যাটাগরি',
      Categories: 'ক্যাটাগরি',
      Report: ' রিপোর্ট',
      Budget: 'বাজেট',
      Investments: 'বিনিয়োগ',
      Settings: 'সেটিংস',
      Period: 'সময়কাল',
      'Sign out': 'সাইন আউট',
      signOut: 'সাইন আউট',

      // Common
      period: 'সময়কাল',
      all: 'সব',
      income: 'আয়',
      expense: 'ব্যয়',
      savings: 'সঞ্চয়',
      payable: 'প্রদানযোগ্য',
      receivable: 'প্রাপ্তযোগ্য',
      add: 'যোগ করুন',

      // Entries
      entriesTitle: 'এন্ট্রি',
      addIncome: 'আয়',
      addExpense: 'ব্যয়',
      addInvestments: 'বিনিয়োগ',
      addSavings: 'সঞ্চয়',
      addPayable: 'প্রদানযোগ্য',
      addReceivable: 'প্রাপ্তযোগ্য',
      noEntries: 'কোন এন্ট্রি পাওয়া যায়নি',
      noEntriesSubtitle: 'ফিল্টার পরিবর্তন করুন বা নতুন এন্ট্রি',
      monthlyEntries: 'মাসিক এন্ট্রি',

      // Investments
      investments: 'বিনিয়োগ',
      trackYourInvestmentEntries: 'আপনার বিনিয়োগ এন্ট্রি ট্র্যাক করুন',
      addInvestment: 'বিনিয়োগ যোগ করুন',
      noInvestmentsYet: 'কোন বিনিয়োগ নেই',
      addYourFirstInvestmentEntry: 'ড্যাশবোর্ডে দেখতে আপনার প্রথম বিনিয়োগ এন্ট্রি যোগ করুন',

      // Budget
      budgetSubtitle: 'মাসিক আয়, বরাদ্দ এবং ক্যাটাগরি ব্যয় পরিকল্পনা করুন।',
      monthlyBudget: 'মাসিক বাজেট',
      monthlyBudgetSubtitle: 'আপনার বাজেট ড্যাশবোর্ডকে বাকি বাজেট এবং বিনিয়োগ প্রভাব দেখাতে সাহায্য করে।',
      monthlyBudgetInputPlaceholder: 'আপনার মাসিক বাজেট লিখুন',
      monthlyBudgetLabel: 'মাসিক বাজেট (BDT)',
      budgetLines: 'বাজেট লাইন',

      // Modals
      addIncomeTitle: 'আয়',
      addExpenseTitle: 'ব্যয়',
      addSavingsTitle: 'সঞ্চয়',
      addPayableTitle: 'প্রদানযোগ্য',
      addReceivableTitle: 'প্রাপ্তযোগ্য',

      // Forms
      amount: 'পরিমাণ',
      note: 'নোট',
      category: 'ক্যাটাগরি',
      source: 'উৎস',
      account: 'অ্যাকাউন্ট',
      date: 'তারিখ',
      sms: 'এসএমএস',
      parseSms: 'এসএমএস পার্স করুন',
      submit: 'জমা দিন',
      cancel: 'বাতিল',

      // Auth
      login: 'লগইন',
      register: 'রেজিস্টার',
      email: 'ইমেইল',
      password: 'পাসওয়ার্ড',
      name: 'নাম',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      signIn: 'সাইন ইন',
      signUp: 'সাইন আপ',
      dontHaveAccount: 'অ্যাকাউন্ট নেই?',
      alreadyHaveAccount: 'অ্যাকাউন্ট আছে?',

      // Dashboard
      totalIncome: 'মোট আয়',
      budget: 'বাজেট',
      budgetHealth: 'বাজেট স্বাস্থ্য',
      planned: 'পরিকল্পিত',
      spent: 'ব্যয়',
      remaining: 'অবশিষ্ট',
      allocated: 'বরাদ্দ',
      totalExpense: 'মোট ব্যয়',
      totalSavings: 'মোট সঞ্চয়',
      netSavings: 'নেট সঞ্চয়',
      savingsRate: 'সঞ্চয় হার',

      // Analytics
      yearlyTrend: 'বার্ষিক প্রবণতা',
      categoryBreakdown: 'ক্যাটাগরি ভাঙ্গন',

      // Sources
      bank: 'ব্যাংক',
      bkash: 'বিকাশ',
      nagad: 'নগদ',
      cash: 'নগদ',
      card: 'কার্ড',
      other: 'অন্যান্য',

      // Categories Page
      categoriesTitle: 'ক্যাটাগরি',
      categoriesSubtitle: 'আপনার ক্যাটাগরি পরিচালনা করুন',
      categoryList: 'ক্যাটাগরি তালিকা',
      categoryListSubtitle: 'আপনার ক্যাটাগরি তালিকা দেখুন',
      categoryListPlaceholder: 'ক্যাটাগরি তালিকা দেখুন',
      manageCategories: 'ক্যাটাগরি পরিচালনা করুন',
      addCategory: 'ক্যাটাগরি',
      categoryName: 'ক্যাটাগরি নাম',
      categoryType: 'ক্যাটাগরি টাইপ',
      newCategory: 'নতুন ক্যাটাগরি',
      icon: 'আইকন',
      color: 'রঙ',
      default: 'ডিফল্ট',
      custom: 'কাস্টম',
      createCategory: 'ক্যাটাগরি তৈরি করুন',
      groceries: 'গ্রোসারিজ',
      ExpenseCategory: 'ব্যয় ক্যাটাগরি',
      IncomeCategory: 'আয় ক্যাটাগরি',
      noCategories: 'কোন ক্যাটাগরি পাওয়া যায়নি',

      // Report Page
      reportTitle: 'রিপোর্ট',
      reportSubtitle: 'আপনার মাসিক আয়, ব্যয় এবং সঞ্চয় রিপোর্ট দেখুন',
      monthlyReport: 'মাসিক রিপোর্ট',
      monthlyReportSubtitle: 'আপনার মাসিক আয়, ব্যয় এবং সঞ্চয় রিপোর্ট দেখুন',
      categoryReport: 'ক্যাটাগরি রিপোর্ট',
      categoryReportSubtitle: 'আপনার ক্যাটাগরি ভিত্তিক আয়, ব্যয় এবং সঞ্চয় রিপোর্ট দেখুন',

      // Settings Page
      settings: 'সেটিংস',
      settingsSubtitle: 'আপনার মাসিক বাজেট এবং প্রোফাইল পছন্দ সেট করুন',
      language: 'ভাষা',
      theme: 'থিম',
      dark: 'ডার্ক',
      light: 'লাইট',
      system: 'সিস্টেম',
      save: 'সংরক্ষণ',
      logout: 'লগ আউট',
      deleteAccount: 'অ্যাকাউন্ট মুছুন',
      deleteAccountConfirm: 'আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্ট মুছে ফেলতে চান?',
      deleteAccountConfirmation: 'এই কার্যকরী হতে পারে না। আপনার সমস্ত ডেটা অনাকাঙ্কিতভাবে মুছে ফেলা হবে। চালিয়ে যান?',
      deleteAccountConfirmationTitle: 'অ্যাকাউন্ট মুছুন',
      deleteAccountConfirmationMessage: 'এই কার্যকরী হতে পারে না। আপনার সমস্ত ডেটা অনাকাঙ্কিতভাবে মুছে ফেলা হবে। চালিয়ে যান?',
      deleteAccountConfirmationButton: 'অ্যাকাউন্ট মুছুন',
      deleteAccountConfirmationButtonText: 'অ্যাকাউন্ট মুছুন',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
