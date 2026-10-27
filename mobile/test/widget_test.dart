import 'package:abmiti/core/localization/app_locale.dart';
import 'package:abmiti/shared/widgets/loading_overlay.dart';
import 'package:abmiti/shared/widgets/no_internet_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('LoadingOverlay builds and displays brand elements',
      (WidgetTester tester) async {
    // Build the LoadingOverlay widget.
    await tester.pumpWidget(
      const MaterialApp(
        home: LoadingOverlay(),
      ),
    );

    // Verify that the brand name is displayed in the default language.
    expect(find.text('Abmiti'), findsOneWidget);

    // Verify that the 'Personal Finance' subtitle is displayed.
    expect(find.text('Personal Finance'), findsOneWidget);

    // Verify that CircularProgressIndicator is present.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('NoInternetScreen displays offline UI and handles retry callback',
      (WidgetTester tester) async {
    bool retryCalled = false;

    // Build the NoInternetScreen widget.
    await tester.pumpWidget(
      MaterialApp(
        home: NoInternetScreen(
          onRetry: () {
            retryCalled = true;
          },
        ),
      ),
    );

    // Verify key UI text and icons are rendered.
    expect(find.text('No internet connection'), findsOneWidget);
    expect(find.byIcon(Icons.wifi_off_rounded), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);

    // Tap the retry button and verify callback.
    await tester.tap(find.text('Try again'));
    await tester.pump(); // Start delayed execution of retry
    await tester.pump(const Duration(
        milliseconds: 900)); // Advance time past Future.delayed (800ms)

    expect(retryCalled, isTrue);
  });

  testWidgets('offline and loading screens render in Bengali',
      (WidgetTester tester) async {
    final locale = AppLocale();
    // Set the language without awaiting persistence: secure storage has no
    // platform implementation in widget tests.
    locale.setLanguage(AppLanguage.bn);
    await tester.pump();
    expect(locale.isBengali, isTrue);

    await tester.pumpWidget(
      LocaleScope(
        locale: locale,
        child: const MaterialApp(home: LoadingOverlay()),
      ),
    );
    expect(find.text('অবমিতি'), findsOneWidget);
    expect(find.text('ব্যক্তিগত অর্থায়ন'), findsOneWidget);

    await tester.pumpWidget(
      LocaleScope(
        locale: locale,
        child: MaterialApp(home: NoInternetScreen(onRetry: () {})),
      ),
    );
    expect(find.text('ইন্টারনেট সংযোগ নেই'), findsOneWidget);
    expect(find.text('আবার চেষ্টা করুন'), findsOneWidget);
  });
}
