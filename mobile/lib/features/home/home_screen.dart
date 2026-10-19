import 'package:flutter/material.dart';

import '../../core/localization/app_locale.dart';
import '../../shared/data/auth_repository.dart';
import '../../shared/data/finance_repository.dart';
import '../shell/app_shell.dart';

/// Legacy entry point backwards-compatible with AppShell.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.auth});

  final AuthRepository auth;

  @override
  Widget build(BuildContext context) {
    final existingScope =
        context.dependOnInheritedWidgetOfExactType<LocaleScope>();
    final content = AppShell(
      auth: auth,
      financeRepo: FinanceRepository(auth.api),
    );

    if (existingScope != null) return content;
    return LocaleScope(
      locale: AppLocale(auth.storage),
      child: content,
    );
  }
}
