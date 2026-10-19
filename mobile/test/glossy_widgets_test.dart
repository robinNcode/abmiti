import 'package:abmiti/shared/widgets/empty_state.dart';
import 'package:abmiti/shared/widgets/glossy_card.dart';
import 'package:abmiti/shared/widgets/month_year_picker.dart';
import 'package:abmiti/shared/widgets/progress_ring.dart';
import 'package:abmiti/shared/widgets/section_header.dart';
import 'package:abmiti/shared/widgets/stat_chip.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('GlossyCard renders child and handles taps', (tester) async {
    bool tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GlossyCard(
            onTap: () => tapped = true,
            child: const Text('Glossy Content'),
          ),
        ),
      ),
    );

    expect(find.text('Glossy Content'), findsOneWidget);
    await tester.tap(find.text('Glossy Content'));
    expect(tapped, isTrue);
  });

  testWidgets('StatChip displays label, amount, and icon', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: StatChip(
            label: 'Total Savings',
            amount: '৳25,000',
            icon: Icons.savings_outlined,
          ),
        ),
      ),
    );

    expect(find.text('Total Savings'), findsOneWidget);
    expect(find.text('৳25,000'), findsOneWidget);
    expect(find.byIcon(Icons.savings_outlined), findsOneWidget);
  });

  testWidgets('MonthYearPicker responds to previous and next month buttons',
      (tester) async {
    DateTime current = DateTime(2026, 10, 1);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) => MonthYearPicker(
              selectedDate: current,
              onChanged: (newDate) {
                setState(() => current = newDate);
              },
            ),
          ),
        ),
      ),
    );

    expect(find.text('October 2026'), findsOneWidget);

    // Tap previous month
    await tester.tap(find.byIcon(Icons.chevron_left_rounded));
    await tester.pump();
    expect(current.month, 9);
    expect(find.text('September 2026'), findsOneWidget);

    // Tap next month
    await tester.tap(find.byIcon(Icons.chevron_right_rounded));
    await tester.pump();
    expect(current.month, 10);
    expect(find.text('October 2026'), findsOneWidget);
  });

  testWidgets('ProgressRing renders and displays percentage text',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ProgressRing(percentage: 0.65),
        ),
      ),
    );

    expect(find.text('65%'), findsOneWidget);
    expect(find.text('Used'), findsOneWidget);
  });

  testWidgets('EmptyState displays icon and title with action callback',
      (tester) async {
    bool actionCalled = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EmptyState(
            icon: Icons.inbox_rounded,
            title: 'No Data Here',
            subtitle: 'Try again later',
            actionLabel: 'Click Me',
            action: () => actionCalled = true,
          ),
        ),
      ),
    );

    expect(find.text('No Data Here'), findsOneWidget);
    expect(find.text('Try again later'), findsOneWidget);
    expect(find.text('Click Me'), findsOneWidget);

    await tester.tap(find.text('Click Me'));
    expect(actionCalled, isTrue);
  });

  testWidgets('SectionHeader displays title and action button', (tester) async {
    bool actionCalled = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SectionHeader(
            title: 'My Section',
            action: 'See More',
            onAction: () => actionCalled = true,
          ),
        ),
      ),
    );

    expect(find.text('My Section'), findsOneWidget);
    expect(find.text('See More'), findsOneWidget);

    await tester.tap(find.text('See More'));
    expect(actionCalled, isTrue);
  });
}
