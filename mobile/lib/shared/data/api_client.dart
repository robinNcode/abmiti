import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this.storage, {String? baseUrl})
      : dio = Dio(BaseOptions(
          baseUrl: baseUrl != null
              ? '${baseUrl.replaceAll(RegExp(r'/+$'), '')}/'
              : '${const String.fromEnvironment(
                  'API_BASE_URL',
                  defaultValue: 'http://localhost:5000/api/v1',
                ).replaceAll(RegExp(r'/+$'), '')}/',
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          sendTimeout: const Duration(seconds: 15),
          headers: const {'Content-Type': 'application/json'},
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'accessToken');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode != 401 ||
            error.requestOptions.extra['retried'] == true ||
            error.requestOptions.path.endsWith('/auth/refresh')) {
          handler.next(error);
          return;
        }
        try {
          final refreshToken = await storage.read(key: 'refreshToken');
          if (refreshToken == null) {
            throw const ApiException('Please sign in again.');
          }
          final response = await dio.post('/auth/refresh',
              data: {'refreshToken': refreshToken},
              options: Options(extra: {'retried': true}));
          final data = Map<String, dynamic>.from(response.data['data'] as Map);
          await storage.write(
              key: 'accessToken', value: data['accessToken'] as String);
          await storage.write(
              key: 'refreshToken', value: data['refreshToken'] as String);
          final retry = error.requestOptions;
          retry.extra['retried'] = true;
          retry.headers['Authorization'] = 'Bearer ${data['accessToken']}';
          handler.resolve(await dio.fetch(retry));
        } catch (_) {
          await storage.deleteAll();
          await onSessionExpired?.call();
          handler.next(error);
        }
      },
    ));
  }

  final FlutterSecureStorage storage;
  final Dio dio;
  Future<void> Function()? onSessionExpired;

  String _apiPath(String path) =>
      path.startsWith('/') ? path.substring(1) : path;

  Dio get client => dio;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async =>
      _data(await dio.get(_apiPath(path), queryParameters: query));
  Future<Map<String, dynamic>> getPage(String path,
          {Map<String, dynamic>? query}) async =>
      Map<String, dynamic>.from(
          (await dio.get(_apiPath(path), queryParameters: query)).data as Map);
  Future<dynamic> post(String path, {Object? body}) async =>
      _data(await dio.post(_apiPath(path), data: body));
  Future<dynamic> put(String path, {Object? body}) async =>
      _data(await dio.put(_apiPath(path), data: body));
  Future<dynamic> patch(String path, {Object? body}) async =>
      _data(await dio.patch(_apiPath(path), data: body));
  Future<dynamic> delete(String path) async =>
      _data(await dio.delete(_apiPath(path)));
  dynamic _data(Response<dynamic> response) => response.data['data'];

  String get currentBaseUrl => dio.options.baseUrl;

  void updateBaseUrl(String newUrl) {
    dio.options.baseUrl = '${newUrl.replaceAll(RegExp(r'/+$'), '')}/';
  }

  /// Test connectivity to a specific URL or the current base URL.
  Future<({bool success, int latencyMs, String message})> testConnection([
    String? targetUrl,
  ]) async {
    final stopwatch = Stopwatch()..start();
    final effectiveUrl = targetUrl != null && targetUrl.trim().isNotEmpty
        ? targetUrl.trim()
        : dio.options.baseUrl;
    final healthEndpoint =
        '${effectiveUrl.replaceAll(RegExp(r'/+$'), '')}/health';

    try {
      final testDio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 4),
        receiveTimeout: const Duration(seconds: 4),
      ));
      final response = await testDio.get(healthEndpoint);
      stopwatch.stop();

      if (response.statusCode == 200) {
        return (
          success: true,
          latencyMs: stopwatch.elapsedMilliseconds,
          message:
              'Connected successfully (${stopwatch.elapsedMilliseconds}ms)',
        );
      }
      return (
        success: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: 'Server responded with HTTP ${response.statusCode}',
      );
    } catch (e) {
      stopwatch.stop();
      if (e is DioException) {
        if (e.type == DioExceptionType.connectionTimeout) {
          return (
            success: false,
            latencyMs: stopwatch.elapsedMilliseconds,
            message:
                'Timed out. Verify PC IP or run: adb reverse tcp:5000 tcp:5000',
          );
        }
        if (e.type == DioExceptionType.connectionError) {
          return (
            success: false,
            latencyMs: stopwatch.elapsedMilliseconds,
            message:
                'Connection refused. Is backend running? On diff router, run: adb reverse tcp:5000 tcp:5000',
          );
        }
      }
      return (
        success: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: e.toString(),
      );
    }
  }

  static String messageFrom(Object error) {
    if (error is ApiException) return error.message;
    if (error is DioException) {
      final body = error.response?.data;
      if (body is Map && body['message'] is String) {
        return body['message'] as String;
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Could not connect. Check your internet and try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
