import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      entries: 'Entries',
      analytics: 'Analytics',
      categories: 'Categories',
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
      addSavings: 'Add Savings',
      addPayable: 'Add Payable',
      addReceivable: 'Add Receivable',
      noEntries: 'No entries found',
      noEntriesSubtitle: 'Try changing filters or add a new entry',

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
      totalExpense: 'Total Expense',
      totalSavings: 'Total Savings',
      netSavings: 'Net Savings',
      savingsRate: 'Savings Rate',

      // Analytics
      yearlyTrend: 'Yearly Trend',
      categoryBreakdown: 'Category Breakdown',

      // Categories
      manageCategories: 'Manage Categories',
      addCategory: 'Add Category',
      categoryName: 'Category Name',
      categoryType: 'Category Type',

      // Sources
      bank: 'Bank',
      bkash: 'bKash',
      nagad: 'Nagad',
      cash: 'Cash',
      card: 'Card',
      other: 'Other',
    },
  },
  bn: {
    translation: {
      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      entries: 'এন্ট্রি',
      analytics: 'অ্যানালিটিক্স',
      categories: 'ক্যাটাগরি',
      signOut: 'সাইন আউট',

      // Common
      period: 'সময়কাল',
      all: 'সব',
      income: 'আয়',
      expense: 'বেয়',
      savings: 'সঞ্চয়',
      payable: 'প্রদানযোগ্য',
      receivable: 'প্রাপ্তযোগ্য',
      add: 'যোগ করুন',

      // Entries
      entriesTitle: 'এন্ট্রি',
      addIncome: 'আয় যোগ করুন',
      addExpense: 'বেয় যোগ করুন',
      addSavings: 'সঞ্চয় যোগ করুন',
      addPayable: 'প্রদানযোগ্য যোগ করুন',
      addReceivable: 'প্রাপ্তযোগ্য যোগ করুন',
      noEntries: 'কোন এন্ট্রি পাওয়া যায়নি',
      noEntriesSubtitle: 'ফিল্টার পরিবর্তন করুন বা নতুন এন্ট্রি যোগ করুন',

      // Modals
      addIncomeTitle: 'আয় যোগ করুন',
      addExpenseTitle: 'বেয় যোগ করুন',
      addSavingsTitle: 'সঞ্চয় যোগ করুন',
      addPayableTitle: 'প্রদানযোগ্য যোগ করুন',
      addReceivableTitle: 'প্রাপ্তযোগ্য যোগ করুন',

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
      totalExpense: 'মোট বেয়',
      totalSavings: 'মোট সঞ্চয়',
      netSavings: 'নেট সঞ্চয়',
      savingsRate: 'সঞ্চয় হার',

      // Analytics
      yearlyTrend: 'বার্ষিক প্রবণতা',
      categoryBreakdown: 'ক্যাটাগরি ভাঙ্গন',

      // Categories
      manageCategories: 'ক্যাটাগরি পরিচালনা করুন',
      addCategory: 'ক্যাটাগরি যোগ করুন',
      categoryName: 'ক্যাটাগরি নাম',
      categoryType: 'ক্যাটাগরি টাইপ',

      // Sources
      bank: 'ব্যাংক',
      bkash: 'বিকাশ',
      nagad: 'নগদ',
      cash: 'নগদ',
      card: 'কার্ড',
      other: 'অন্যান্য',
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
