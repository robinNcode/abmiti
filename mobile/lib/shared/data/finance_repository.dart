import 'package:dio/dio.dart';

import 'api_client.dart';

/// Centralized repository for all personal finance APIs:
/// Summaries, Analytics, Categories, Budgets, and Entries.
class FinanceRepository {
  FinanceRepository(this._apiClient);

  final ApiClient _apiClient;

  // ── Summaries & Analytics ──────────────────────────────────

  Future<Map<String, dynamic>> fetchMonthlySummary(int month, int year) async {
    final response = await _apiClient.client.get(
      '/summary/monthly',
      queryParameters: {'month': month, 'year': year},
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<List<Map<String, dynamic>>> fetchCategoryBreakdown(
      int month, int year) async {
    final response = await _apiClient.client.get(
      '/summary/categories',
      queryParameters: {'month': month, 'year': year},
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is List) {
      return (data['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchYearlyTrend(int year) async {
    final response = await _apiClient.client.get(
      '/summary/yearly',
      queryParameters: {'year': year},
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is List) {
      return (data['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> fetchYearlySummary(int year) async {
    final response = await _apiClient.client.get(
      '/summary/yearly-summary',
      queryParameters: {'year': year},
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<List<Map<String, dynamic>>> fetchBudgetWarnings() async {
    final response = await _apiClient.client.get('/summary/budget-warnings');
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is List) {
      return (data['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }
    return [];
  }

  // ── Categories ─────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchCategories({String? type}) async {
    final queryParams = <String, dynamic>{};
    if (type != null && type.isNotEmpty) {
      queryParams['type'] = type;
    }
    final response = await _apiClient.client.get(
      '/categories',
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is List) {
      return (data['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> createCategory(
      Map<String, dynamic> payload) async {
    final response = await _apiClient.client.post('/categories', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<Map<String, dynamic>> updateCategory(
      String id, Map<String, dynamic> payload) async {
    final response =
        await _apiClient.client.patch('/categories/$id', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<void> deleteCategory(String id) async {
    await _apiClient.client.delete('/categories/$id');
  }

  // ── Budgets ────────────────────────────────────────────────

  Future<Map<String, dynamic>?> fetchBudget(int month, int year) async {
    try {
      final response = await _apiClient.client.get(
        '/budgets',
        queryParameters: {'month': month, 'year': year},
      );
      final data = response.data;
      if (data is Map<String, dynamic> &&
          data['data'] is Map<String, dynamic>) {
        return data['data'] as Map<String, dynamic>;
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> fetchBudgetSummary(String budgetId) async {
    try {
      final response =
          await _apiClient.client.get('/budgets/$budgetId/summary');
      final data = response.data;
      if (data is Map<String, dynamic> &&
          data['data'] is Map<String, dynamic>) {
        return data['data'] as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> saveBudget(Map<String, dynamic> payload) async {
    final response = await _apiClient.client.post('/budgets', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<Map<String, dynamic>> updateBudget(
      String budgetId, Map<String, dynamic> payload) async {
    final response =
        await _apiClient.client.put('/budgets/$budgetId', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<Map<String, dynamic>> addBudgetLine(
      String budgetId, Map<String, dynamic> lineData) async {
    final response = await _apiClient.client
        .post('/budgets/$budgetId/lines', data: lineData);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<void> updateBudgetLine(
      String budgetId, String lineId, Map<String, dynamic> lineData) async {
    await _apiClient.client
        .put('/budgets/$budgetId/lines/$lineId', data: lineData);
  }

  Future<void> deleteBudgetLine(String budgetId, String lineId) async {
    await _apiClient.client.delete('/budgets/$budgetId/lines/$lineId');
  }

  // ── Notifications ────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchNotifications() async {
    final response = await _apiClient.client.get('/notifications');
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is List) {
      return (data['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    }
    return [];
  }

  Future<void> markNotificationRead(String id) async {
    await _apiClient.client.patch('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _apiClient.client.patch('/notifications/read-all');
  }

  // ── Entries (Ledger) ───────────────────────────────────────

  Future<Map<String, dynamic>> fetchEntries({
    int page = 1,
    int limit = 20,
    String? type,
    int? month,
    int? year,
    String? categoryId,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (type != null && type.isNotEmpty) queryParams['type'] = type;
    if (month != null) queryParams['month'] = month;
    if (year != null) queryParams['year'] = year;
    if (categoryId != null && categoryId.isNotEmpty) {
      queryParams['category'] = categoryId;
    }

    final response = await _apiClient.client.get(
      '/entries',
      queryParameters: queryParams,
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {};
  }

  Future<Map<String, dynamic>> createEntry(Map<String, dynamic> payload) async {
    final response = await _apiClient.client.post('/entries', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<Map<String, dynamic>> updateEntry(
      String id, Map<String, dynamic> payload) async {
    final response =
        await _apiClient.client.patch('/entries/$id', data: payload);
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] is Map<String, dynamic>) {
      return data['data'] as Map<String, dynamic>;
    }
    return {};
  }

  Future<void> deleteEntry(String id) async {
    await _apiClient.client.delete('/entries/$id');
  }
}
