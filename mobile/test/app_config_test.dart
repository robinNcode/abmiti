import 'package:abmiti/core/config/app_config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppConfig Tests', () {
    test('normalizes URLs removing trailing slashes', () {
      expect(
        AppConfig.normalizeUrl('http://127.0.0.1:5000/api/v1/'),
        'http://127.0.0.1:5000/api/v1',
      );
      expect(
        AppConfig.normalizeUrl('http://localhost:5000///'),
        'http://localhost:5000',
      );
    });

    test('parses environment by id', () {
      expect(
        ApiEnvironment.fromId('production'),
        ApiEnvironment.production,
      );
      expect(
        ApiEnvironment.fromId('local'),
        ApiEnvironment.local,
      );
      // Unknown → defaults to local
      expect(
        ApiEnvironment.fromId('unknown_id'),
        ApiEnvironment.local,
      );
      // null → defaults to local
      expect(
        ApiEnvironment.fromId(null),
        ApiEnvironment.local,
      );
    });

    test('production env has correct default URL', () {
      expect(
        ApiEnvironment.production.defaultUrl,
        'https://robin.adovasoft.com/abmiti-app/api/v1',
      );
    });

    test('local env has correct default URL', () {
      expect(
        ApiEnvironment.local.defaultUrl,
        'http://127.0.0.1:5000/api/v1',
      );
    });

    test('initializes in debug mode (local by default)', () async {
      FlutterSecureStorage.setMockInitialValues({});
      const storage = FlutterSecureStorage();
      final config = AppConfig(storage);
      await config.initialize();

      // In test / debug mode kReleaseMode is false → local
      expect(config.currentEnv, ApiEnvironment.local);
      expect(config.currentBaseUrl, 'http://127.0.0.1:5000/api/v1');
    });

    test('notifies listeners on initialize', () async {
      FlutterSecureStorage.setMockInitialValues({});
      const storage = FlutterSecureStorage();
      final config = AppConfig(storage);

      var notified = false;
      config.addListener(() => notified = true);

      await config.initialize();
      expect(notified, true);
    });
  });
}
