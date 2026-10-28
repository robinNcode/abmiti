import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_client.dart';

class AuthRepository extends ChangeNotifier {
  AuthRepository(this.api, this.storage) {
    api.onSessionExpired = signOut;
  }
  final ApiClient api;
  final FlutterSecureStorage storage;
  Map<String, dynamic>? user;

  ApiClient get apiClient => api;
  Map<String, dynamic>? get currentUser => user;

  Future<void> restore() async {
    final token = await storage.read(key: 'accessToken');
    if (token == null) return;
    try {
      user = Map<String, dynamic>.from(await api.get('/auth/me') as Map);
      if (user?['userType'] == 'admin') await signOut();
      notifyListeners();
    } catch (_) {
      final refreshed = await storage.read(key: 'accessToken');
      if (refreshed != null) {
        try {
          user = Map<String, dynamic>.from(await api.get('/auth/me') as Map);
          notifyListeners();
        } catch (_) {
          await signOut();
        }
      }
    }
  }

  Future<void> signIn(String email, String password) =>
      _authenticate('/auth/login', {'email': email, 'password': password});

  Future<void> register(String name, String email, String password) =>
      _authenticate('/auth/register',
          {'name': name, 'email': email, 'password': password});

  Future<void> _authenticate(String path, Map<String, dynamic> body) async {
    final result =
        Map<String, dynamic>.from(await api.post(path, body: body) as Map);
    await _save(result);
  }

  Future<void> _save(Map<String, dynamic> result) async {
    user = Map<String, dynamic>.from(result['user'] as Map);
    await storage.write(
        key: 'accessToken', value: result['accessToken'] as String);
    await storage.write(
        key: 'refreshToken', value: result['refreshToken'] as String);
    if (user?['userType'] == 'admin') {
      await signOut();
      throw const ApiException('Admin accounts use the web dashboard.');
    }
    notifyListeners();
  }

  /// Sign in using access and refresh tokens returned from OAuth (e.g. Google Sign-In)
  Future<void> signInWithTokens(String accessToken, String refreshToken) async {
    await storage.write(key: 'accessToken', value: accessToken);
    await storage.write(key: 'refreshToken', value: refreshToken);
    final profile = Map<String, dynamic>.from(await api.get('/auth/me') as Map);
    user = profile;
    if (user?['userType'] == 'admin') {
      await signOut();
      throw const ApiException('Admin accounts use the web dashboard.');
    }
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> values) async {
    user = Map<String, dynamic>.from(
        await api.patch('/auth/me', body: values) as Map);
    notifyListeners();
  }

  Future<void> signOut() async {
    user = null;
    await storage.deleteAll();
    notifyListeners();
  }
}
