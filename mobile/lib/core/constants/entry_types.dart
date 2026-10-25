import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Entry types supported by the ledger — mirrors the server's `EntryType`
/// union (`income | expense | savings | investment | payable | receivable`).
class EntryTypes {
  EntryTypes._();

  static const List<String> all = [
    'income',
    'expense',
    'savings',
    'investment',
    'payable',
    'receivable',
  ];

  static const Map<String, String> labels = {
    'income': 'Income',
    'expense': 'Expense',
    'savings': 'Savings',
    'investment': 'Investment',
    'payable': 'Payable',
    'receivable': 'Receivable',
  };

  static const Map<String, IconData> icons = {
    'income': Icons.arrow_downward_rounded,
    'expense': Icons.arrow_upward_rounded,
    'savings': Icons.savings_outlined,
    'investment': Icons.candlestick_chart_rounded,
    'payable': Icons.payments_outlined,
    'receivable': Icons.downloading_rounded,
  };

  static const Map<String, Color> colors = {
    'income': AppColors.sage,
    'expense': AppColors.terra,
    'savings': AppColors.mustard,
    'investment': AppColors.ink,
    'payable': AppColors.danger,
    'receivable': AppColors.success,
  };

  static bool isCredit(String type) => type == 'income' || type == 'receivable';

  static String labelOf(String type) => labels[type] ?? type;

  static IconData iconOf(String type) =>
      icons[type] ?? Icons.receipt_long_rounded;

  static Color colorOf(String type) => colors[type] ?? AppColors.terra;

  /// Category type used when listing categories for an entry type.
  /// Categories are seeded per entry type; `investment` has no seeded set, so
  /// it falls back to expense categories (same behaviour as the web client).
  static String categoryTypeOf(String type) =>
      type == 'investment' ? 'expense' : type;
}
