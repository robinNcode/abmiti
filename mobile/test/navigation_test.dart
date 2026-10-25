import 'package:abmiti/features/shell/app_shell.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/auth_repository.dart';
import 'package:abmiti/shared/data/finance_repository.dart';
import 'package:abmiti/shared/widgets/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Future<AppShell> buildShell(WidgetTester tester) async {
    const storage = FlutterSecureStorage();
    final api = ApiClient(storage);
    final auth = AuthRepository(api, storage);
    final repo = FinanceRepository(api);
    final shell = AppShell(auth: auth, financeRepo: repo);

    await tester.pumpWidget(MaterialApp(home: shell));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    return shell;
  }

  testWidgets('shell renders the bottom navigation bar with four tabs',
      (tester) async {
    await buildShell(tester);

    expect(find.byType(CurvedNavigationBar), findsOneWidget);
    expect(find.byType(AppBar), findsOneWidget);
    for (final icon in [
      Icons.dashboard_rounded,
      Icons.receipt_long_rounded,
      Icons.pie_chart_rounded,
      Icons.insights_rounded,
    ]) {
      expect(
        find.descendant(
          of: find.byType(CurvedNavigationBar),
          matching: find.byIcon(icon),
        ),
        findsAtLeastNWidgets(1),
      );
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('bottom navigation switches tabs and keeps a single app bar',
      (tester) async {
    await buildShell(tester);

    await tester.tap(
      find.descendant(
        of: find.byType(CurvedNavigationBar),
        matching: find.byIcon(Icons.pie_chart_rounded),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(AppBar), findsOneWidget);
    expect(
      find.descendant(of: find.byType(AppBar), matching: find.text('Budgets')),
      findsOneWidget,
    );

    await tester.tap(
      find.descendant(
        of: find.byType(CurvedNavigationBar),
        matching: find.byIcon(Icons.insights_rounded),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(AppBar), findsOneWidget);
    expect(
      find.descendant(
          of: find.byType(AppBar), matching: find.text('Analytics')),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });
}
