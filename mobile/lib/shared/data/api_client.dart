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

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async =>
      _data(await dio.get(_apiPath(path), queryParameters: query));
  Future<Map<String, dynamic>> getPage(String path,
          {Map<String, dynamic>? query}) async =>
      Map<String, dynamic>.from(
          (await dio.get(_apiPath(path), queryParameters: query)).data as Map);
  Future<dynamic> post(String path, {Object? body}) async =>
      _data(await dio.post(_apiPath(path), data: body));
  Future<dynamic> patch(String path, {Object? body}) async =>
      _data(await dio.patch(_apiPath(path), data: body));

  dynamic _data(Response<dynamic> response) => response.data['data'];

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
