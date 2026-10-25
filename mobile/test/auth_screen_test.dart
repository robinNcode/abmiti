import 'package:abmiti/features/auth/auth_screen.dart';
import 'package:abmiti/shared/data/api_client.dart';
import 'package:abmiti/shared/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('login form validates email and password before sending',
      (tester) async {
    const storage = FlutterSecureStorage();
    final auth = AuthRepository(ApiClient(storage), storage);
    await tester.pumpWidget(MaterialApp(home: AuthScreen(auth: auth)));

    await tester.tap(find.text('Sign in'));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Use at least 6 characters'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('registration reveals the name field', (tester) async {
    const storage = FlutterSecureStorage();
    final auth = AuthRepository(ApiClient(storage), storage);
    await tester.pumpWidget(MaterialApp(home: AuthScreen(auth: auth)));

    await tester.tap(find.text('New to Abmiti? Create an account'));
    await tester.pumpAndSettle();

    expect(find.text('Full name'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
  });
}
