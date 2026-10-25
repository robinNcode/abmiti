import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/shimmer_loading.dart';

/// True when [notification] has been read by [userId].
bool notificationIsRead(Map<String, dynamic> notification, String? userId) {
  if (userId == null || userId.isEmpty) return false;
  final raw = notification['readBy'] ?? notification['read_by'];
  if (raw is List) return raw.map((e) => e.toString()).contains(userId);
  return false;
}

/// Number of notifications in [items] not yet read by [userId].
int unreadNotificationCount(List<Map<String, dynamic>> items, String? userId) =>
    items.where((n) => !notificationIsRead(n, userId)).length;

/// In-app notification inbox: list, mark one read, mark all read.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({
    super.key,
    required this.financeRepo,
    required this.userId,
  });

  final FinanceRepository financeRepo;

  /// Signed-in user id — used to resolve per-user read state.
  final String? userId;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _markingAll = false;
  String? _error;

  String? get _userId => widget.userId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await widget.financeRepo.fetchNotifications();
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ApiClient.messageFrom(e);
        _loading = false;
      });
    }
  }

  Future<void> _markRead(Map<String, dynamic> item) async {
    final id = item['_id']?.toString();
    if (id == null || notificationIsRead(item, _userId)) return;

    setState(() {
      final readBy =
          (item['readBy'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (_userId != null && !readBy.contains(_userId)) readBy.add(_userId!);
      item['readBy'] = readBy;
    });

    try {
      await widget.financeRepo.markNotificationRead(id);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        final readBy = (item['readBy'] as List?)?.toList() ?? [];
        readBy.remove(_userId);
        item['readBy'] = readBy;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.messageFrom(e))),
      );
    }
  }

  Future<void> _markAllRead() async {
    if (_markingAll) return;
    setState(() => _markingAll = true);

    final previous = _items
        .map((n) => MapEntry(n, (n['readBy'] as List?)?.toList()))
        .toList();
    if (_userId != null) {
      setState(() {
        for (final n in _items) {
          final readBy =
              (n['readBy'] as List?)?.map((e) => e.toString()).toList() ?? [];
          if (!readBy.contains(_userId)) readBy.add(_userId!);
          n['readBy'] = readBy;
        }
      });
    }

    try {
      await widget.financeRepo.markAllNotificationsRead();
      if (mounted) setState(() => _markingAll = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        for (final entry in previous) {
          entry.key['readBy'] = entry.value;
        }
        _markingAll = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.messageFrom(e))),
      );
    }
  }

  String _formatDate(String? raw, AppLocale loc) {
    final dt = DateTime.tryParse(raw ?? '');
    if (dt == null) return '';
    final local = dt.toLocal();
    final now = DateTime.now();
    final diff = now.difference(local);
    if (diff.inMinutes < 1) return loc.tr('time_just_now');
    if (diff.inMinutes < 60) {
      return loc.tr('time_minutes_ago').replaceAll('{n}', '${diff.inMinutes}');
    }
    if (diff.inHours < 24) {
      return loc.tr('time_hours_ago').replaceAll('{n}', '${diff.inHours}');
    }
    if (diff.inDays < 7) {
      return loc.tr('time_days_ago').replaceAll('{n}', '${diff.inDays}');
    }
    return '${local.day}/${local.month}/${local.year}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = context.appLocale;
    final unread = unreadNotificationCount(_items, _userId);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('notifications_title'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          TextButton(
            onPressed: unread > 0 && !_markingAll ? _markAllRead : null,
            child: _markingAll
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(loc.tr('mark_all_read')),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const SingleChildScrollView(
                padding: EdgeInsets.all(20),
                child: ShimmerLoading(count: 6),
              )
            : _error != null
                ? ErrorState(message: _error!, onRetry: _load)
                : _items.isEmpty
                    ? ListView(
                        children: [
                          const SizedBox(height: 120),
                          EmptyState(
                            icon: Icons.notifications_none_rounded,
                            title: loc.tr('no_notifications'),
                            subtitle: loc.tr('no_notifications_hint'),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          final isRead = notificationIsRead(item, _userId);
                          final title = item['title']?.toString() ??
                              loc.tr('notification_fallback');
                          final message = item['message']?.toString() ?? '';

                          return InkWell(
                            onTap: () => _markRead(item),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isRead
                                    ? (isDark
                                        ? AppColors.darkSurface
                                        : AppColors.paper)
                                    : (isDark
                                        ? AppColors.darkElevated
                                        : AppColors.paperCard),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isRead
                                      ? (isDark
                                          ? AppColors.darkBorder
                                          : AppColors.paperMist)
                                      : AppColors.terra.withAlpha(70),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(9),
                                    decoration: BoxDecoration(
                                      color: (isRead
                                              ? AppColors.inkLight
                                              : AppColors.terra)
                                          .withAlpha(25),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      isRead
                                          ? Icons.notifications_none_rounded
                                          : Icons.notifications_active_rounded,
                                      size: 20,
                                      color: isRead
                                          ? AppColors.inkLight
                                          : AppColors.terra,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                title,
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 14,
                                                  color: isRead
                                                      ? (isDark
                                                          ? AppColors.darkMuted
                                                          : AppColors.inkLight)
                                                      : null,
                                                ),
                                              ),
                                            ),
                                            if (!isRead)
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: const BoxDecoration(
                                                  color: AppColors.terra,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        if (message.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            message,
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              height: 1.35,
                                              color: isDark
                                                  ? AppColors.darkMuted
                                                  : AppColors.inkLight,
                                            ),
                                          ),
                                        ],
                                        const SizedBox(height: 6),
                                        Text(
                                          _formatDate(
                                            (item['createdAt'] ??
                                                    item['created_at'])
                                                ?.toString(),
                                            loc,
                                          ),
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: isDark
                                                ? AppColors.darkMuted
                                                : AppColors.inkLight,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
