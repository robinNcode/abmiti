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

    test('default URL is configured', () {
      expect(
        AppConfig.defaultBaseUrl,
        'https://robin.adovasoft.com/abmiti-app/api/v1',
      );
    });

    test('initializes with default URL', () async {
      FlutterSecureStorage.setMockInitialValues({});
      const storage = FlutterSecureStorage();
      final config = AppConfig(storage);
      await config.initialize();

      expect(config.currentBaseUrl, 'https://robin.adovasoft.com/abmiti-app/api/v1');
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
