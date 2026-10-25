import 'package:abmiti/shared/widgets/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('CurvedNavigationBar renders items and triggers onTap',
      (tester) async {
    int selectedIndex = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: StatefulBuilder(
            builder: (context, setState) => CurvedNavigationBar(
              index: selectedIndex,
              items: const [
                Icon(Icons.home, key: Key('home_icon')),
                Icon(Icons.list, key: Key('list_icon')),
                Icon(Icons.settings, key: Key('settings_icon')),
              ],
              onTap: (index) {
                setState(() => selectedIndex = index);
              },
            ),
          ),
        ),
      ),
    );

    // Verify icons are present
    expect(find.byKey(const Key('home_icon')), findsWidgets);
    expect(find.byKey(const Key('list_icon')), findsWidgets);
    expect(find.byKey(const Key('settings_icon')), findsWidgets);

    // Tap second item
    await tester.tap(find.byKey(const Key('list_icon')).last);
    await tester.pumpAndSettle();

    expect(selectedIndex, 1);
  });
}
