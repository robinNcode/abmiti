import 'package:abmiti/core/config/app_config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppConfig Tests', () {
    test('normalizes URLs removing trailing slashes', () {
      expect(
        AppConfig.normalizeUrl('http://192.168.26.65:5000/api/v1/'),
        'http://192.168.26.65:5000/api/v1',
      );
      expect(
        AppConfig.normalizeUrl('http://localhost:5000///'),
        'http://localhost:5000',
      );
    });

    test('parses environment by id or name', () {
      expect(
        ApiEnvironment.fromId('production'),
        ApiEnvironment.production,
      );
      expect(
        ApiEnvironment.fromId('same_router_lan'),
        ApiEnvironment.sameRouterLan,
      );
      expect(
        ApiEnvironment.fromId('different_router_usb'),
        ApiEnvironment.differentRouterUsb,
      );
      expect(
        ApiEnvironment.fromId('custom'),
        ApiEnvironment.custom,
      );
    });

    test('initializes with default development environment', () async {
      FlutterSecureStorage.setMockInitialValues({});
      const storage = FlutterSecureStorage();
      final config = AppConfig(storage);
      await config.initialize();

      expect(config.currentEnv, ApiEnvironment.differentRouterUsb);
      expect(config.currentBaseUrl, 'http://127.0.0.1:5000/api/v1');
    });

    test('switches environment and notifies listeners', () async {
      FlutterSecureStorage.setMockInitialValues({});
      const storage = FlutterSecureStorage();
      final config = AppConfig(storage);
      await config.initialize();

      var notified = false;
      config.addListener(() => notified = true);

      await config.setEnvironment(ApiEnvironment.production);
      expect(notified, true);
      expect(config.currentEnv, ApiEnvironment.production);
      expect(config.currentBaseUrl, 'https://voltwavebd.com/abmiti/api/v1');

      await config.setEnvironment(
        ApiEnvironment.custom,
        customUrl: 'https://mytunnel.trycloudflare.com/api/v1',
      );
      expect(config.currentEnv, ApiEnvironment.custom);
      expect(
        config.currentBaseUrl,
        'https://mytunnel.trycloudflare.com/api/v1',
      );
    });
  });
}
