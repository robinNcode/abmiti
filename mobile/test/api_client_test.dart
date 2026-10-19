import 'package:abmiti/shared/data/api_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ApiClient error messages', () {
    test('uses the backend message for API failures', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/entries'),
        response: Response(
          requestOptions: RequestOptions(path: '/entries'),
          statusCode: 400,
          data: {'success': false, 'message': 'Amount must be positive'},
        ),
      );

      expect(ApiClient.messageFrom(error), 'Amount must be positive');
    });

    test('explains connection failures in plain language', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/summary/monthly'),
        type: DioExceptionType.connectionTimeout,
      );

      expect(ApiClient.messageFrom(error),
          'Could not connect. Check your internet and try again.');
    });

    test('preserves explicit session errors', () {
      expect(ApiClient.messageFrom(const ApiException('Please sign in again.')),
          'Please sign in again.');
    });
  });
}
