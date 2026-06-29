import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:abmiti/shared/widgets/loading_overlay.dart';
import 'package:abmiti/shared/widgets/no_internet_screen.dart';
import 'package:abmiti/main.dart';

void main() {
  testWidgets('LoadingOverlay builds and displays brand elements',
      (WidgetTester tester) async {
    // Build the LoadingOverlay widget.
    await tester.pumpWidget(
      const MaterialApp(
        home: LoadingOverlay(),
      ),
    );

    // Verify that the Bengali brand name is displayed.
    expect(find.text('আবমিতি'), findsOneWidget);

    // Verify that 'Personal Finance' subtitle is displayed.
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
    expect(find.text('ইন্টারনেট সংযোগ নেই'), findsOneWidget);
    expect(find.byIcon(Icons.wifi_off_rounded), findsOneWidget);
    expect(find.text('আবার চেষ্টা করুন'), findsOneWidget);

    // Tap the retry button and verify callback.
    await tester.tap(find.text('আবার চেষ্টা করুন'));
    await tester.pump(); // Start delayed execution of retry
    await tester.pump(const Duration(milliseconds: 900)); // Advance time past Future.delayed (800ms)

    expect(retryCalled, isTrue);
  });
}



