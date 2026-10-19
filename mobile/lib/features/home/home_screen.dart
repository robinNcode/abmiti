import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.auth});
  final AuthRepository auth;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  int _page = 1;
  String? _error;
  Map<String, dynamic> _summary = {};
  Map<String, dynamic>? _budget;
  List<dynamic> _entries = [];
  List<dynamic> _categories = [];
  List<dynamic> _notifications = [];
  List<dynamic> _subscriptions = [];
  final DateTime _now = DateTime.now();

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
      final month = _now.month, year = _now.year;
      final results = await Future.wait([
        widget.auth.api
            .get('/summary/monthly', query: {'month': month, 'year': year}),
        widget.auth.api
            .get('/summary/categories', query: {'month': month, 'year': year}),
        widget.auth.api.getPage('/entries',
            query: {'month': month, 'year': year, 'page': 1, 'limit': 30}),
        widget.auth.api.get('/budgets', query: {'month': month, 'year': year}),
        widget.auth.api.get('/notifications'),
        widget.auth.api.get('/subscriptions'),
      ]);
      if (!mounted) return;
      _summary = Map<String, dynamic>.from(results[0] as Map);
      _categories = results[1] as List<dynamic>;
      final entryResult = results[2] as Map<String, dynamic>;
      _entries = entryResult['data'] as List<dynamic>? ?? [];
      final pageInfo = entryResult['meta'] as Map<String, dynamic>? ?? {};
      _page = 1;
      _hasMore = _page < ((pageInfo['totalPages'] as num?)?.toInt() ?? 1);
      _budget = results[3] is Map
          ? Map<String, dynamic>.from(results[3] as Map)
          : null;
      _notifications = results[4] as List<dynamic>;
      _subscriptions = results[5] as List<dynamic>;
      setState(() => _loading = false);
    } catch (error) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = ApiClient.messageFrom(error);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
            title: const Text('Abmiti',
                style: TextStyle(fontWeight: FontWeight.w800)),
            actions: [
              IconButton(
                  tooltip: 'Notifications',
                  onPressed: () => _showNotifications(context),
                  icon: Badge(
                      isLabelVisible: _notifications.isNotEmpty,
                      label: Text('${_notifications.length}'),
                      child: const Icon(Icons.notifications_outlined))),
              const SizedBox(width: 8),
            ]),
        body: _loading && _summary.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _error != null && _summary.isEmpty
                ? _errorPanel()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: IndexedStack(
                        index: _tab,
                        children: [_dashboard(), _ledger(), _profile()])),
        floatingActionButton: _tab == 1
            ? FloatingActionButton.extended(
                onPressed: _addEntry,
                icon: const Icon(Icons.add),
                label: const Text('Add entry'))
            : null,
        bottomNavigationBar: NavigationBar(
            selectedIndex: _tab,
            onDestinationSelected: (v) => setState(() => _tab = v),
            destinations: const [
              NavigationDestination(
                  icon: Icon(Icons.space_dashboard_outlined),
                  selectedIcon: Icon(Icons.space_dashboard_rounded),
                  label: 'Overview'),
              NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long_rounded),
                  label: 'Activity'),
              NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: 'Profile'),
            ]),
      );

  Widget _errorPanel() => ListView(children: [
        SizedBox(height: MediaQuery.sizeOf(context).height * .2),
        const Icon(Icons.cloud_off_outlined, size: 54),
        const SizedBox(height: 12),
        Center(child: Text(_error!, textAlign: TextAlign.center)),
        Center(
            child: TextButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again')))
      ]);

  Widget _dashboard() =>
      ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 28), children: [
        Text(_greeting(),
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(_monthLabel(), style: const TextStyle(color: Colors.black54)),
        const SizedBox(height: 20),
        Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
                gradient: const LinearGradient(
                    colors: [AppColors.terra, AppColors.terraDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(24)),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('AVAILABLE THIS MONTH',
                  style: TextStyle(
                      color: Colors.white70,
                      letterSpacing: 1.1,
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(_money(_number(_summary['remainingBudget'])),
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 18),
              Row(children: [
                Expanded(child: _whiteMetric('Income', _summary['income'])),
                const SizedBox(width: 12),
                Expanded(child: _whiteMetric('Spent', _summary['expense']))
              ]),
            ])),
        const SizedBox(height: 24),
        _sectionTitle('Monthly budget',
            action: _budget == null ? null : 'Details'),
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Planned income'),
            Text(_money(_number(_budget?['totalIncome'] ?? _summary['budget'])),
                style: const TextStyle(fontWeight: FontWeight.w700))
          ]),
          const SizedBox(height: 14),
          LinearProgressIndicator(
              value: _ratio(_number(_summary['expense']),
                  _number(_budget?['totalIncome'] ?? _summary['budget'])),
              minHeight: 9,
              borderRadius: BorderRadius.circular(8),
              color: AppColors.sage,
              backgroundColor: AppColors.paperMist),
          const SizedBox(height: 10),
          Text(
              '${(_ratio(_number(_summary['expense']), _number(_budget?['totalIncome'] ?? _summary['budget'])) * 100).round()}% of planned income spent',
              style: const TextStyle(color: Colors.black54, fontSize: 13))
        ])),
        const SizedBox(height: 24),
        _sectionTitle('Spending by category'),
        if (_categories.isEmpty)
          _emptyCard('No category activity this month yet.')
        else
          _card(Column(
              children: _categories.take(6).map((raw) {
            final item = Map<String, dynamic>.from(raw as Map);
            final cat =
                Map<String, dynamic>.from((item['category'] ?? {}) as Map);
            return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(children: [
                  Text((cat['icon'] ?? '📦').toString(),
                      style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Text((cat['name'] ?? 'Category').toString(),
                          style: const TextStyle(fontWeight: FontWeight.w600))),
                  Text(_money(_number(item['total'])),
                      style: const TextStyle(fontWeight: FontWeight.w700))
                ]));
          }).toList())),
        const SizedBox(height: 24),
        _sectionTitle('Recent activity',
            action: 'See all', onAction: () => setState(() => _tab = 1)),
        if (_entries.isEmpty)
          _emptyCard('Your transactions will appear here.')
        else
          ..._entries.take(4).map(_entryTile),
      ]);

  Widget _ledger() =>
      ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 100), children: [
        Text('Activity',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(_monthLabel(), style: const TextStyle(color: Colors.black54)),
        const SizedBox(height: 16),
        if (_entries.isEmpty)
          _emptyCard('No transactions this month. Add your first entry.')
        else ...[
          ..._entries.map(_entryTile),
          if (_hasMore)
            Center(
                child: TextButton(
                    onPressed: _loadingMore ? null : _loadMore,
                    child: _loadingMore
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Load more')))
        ]
      ]);

  Widget _entryTile(dynamic raw) {
    final entry = Map<String, dynamic>.from(raw as Map);
    final category = entry['category'] is Map
        ? Map<String, dynamic>.from(entry['category'] as Map)
        : <String, dynamic>{};
    final type = (entry['type'] ?? 'expense').toString();
    final positive = type == 'income';
    final date = DateTime.tryParse((entry['date'] ?? '').toString());
    return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: _card(Row(children: [
          Container(
              width: 46,
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                  color: AppColors.paperMist,
                  borderRadius: BorderRadius.circular(15)),
              child: Text(
                  (category['icon'] ?? (positive ? '↗' : '↘')).toString(),
                  style: const TextStyle(fontSize: 21))),
          const SizedBox(width: 13),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text((category['name'] ?? (entry['note'] ?? type)).toString(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                    date == null
                        ? 'This month'
                        : '${date.day}/${date.month}/${date.year}',
                    style: const TextStyle(color: Colors.black54, fontSize: 12))
              ])),
          Text('${positive ? '+' : '−'}${_money(_number(entry['amount']))}',
              style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: positive ? AppColors.sage : AppColors.ink))
        ])));
  }

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    try {
      final nextPage = _page + 1;
      final result = await widget.auth.api.getPage('/entries', query: {
        'month': _now.month,
        'year': _now.year,
        'page': nextPage,
        'limit': 30,
      });
      if (!mounted) return;
      _entries.addAll(result['data'] as List<dynamic>? ?? []);
      _page = nextPage;
      final meta = result['meta'] as Map<String, dynamic>? ?? {};
      _hasMore = _page < ((meta['totalPages'] as num?)?.toInt() ?? _page);
    } catch (error) {
      if (mounted) _message(ApiClient.messageFrom(error));
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Widget _profile() => ListView(padding: const EdgeInsets.all(20), children: [
        Text('Your profile',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 18),
        _card(Column(children: [
          CircleAvatar(
              radius: 34,
              backgroundColor: AppColors.paperMist,
              child: Text(
                  (_user['name'] ?? 'A')
                      .toString()
                      .characters
                      .first
                      .toUpperCase(),
                  style: const TextStyle(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                      color: AppColors.terra))),
          const SizedBox(height: 12),
          Text((_user['name'] ?? '').toString(),
              style:
                  const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
          Text((_user['email'] ?? '').toString(),
              style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 12),
          OutlinedButton.icon(
              onPressed: _editProfile,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Edit profile'))
        ])),
        const SizedBox(height: 22),
        _sectionTitle('Subscription'),
        if (_subscriptions.isEmpty)
          _emptyCard(
              'No subscription information is available for this account.')
        else
          ..._subscriptions.map((s) {
            final v = Map<String, dynamic>.from(s as Map);
            return _card(ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.workspace_premium_outlined,
                    color: AppColors.mustard),
                title: Text((v['plan'] ?? 'Plan').toString()),
                subtitle: Text((v['status'] ?? '').toString()),
                trailing: Text((v['expiresAt'] ?? v['expires_at'] ?? '')
                    .toString()
                    .split('T')
                    .first)));
          }),
        const SizedBox(height: 12),
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Choose a plan',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 6),
          const Text('Payments are securely verified by Abmiti after checkout.',
              style: TextStyle(color: Colors.black54, fontSize: 13)),
          const SizedBox(height: 10),
          _planButton('Coffee', '৳100', 'coffee'),
          _planButton('Monthly', '৳299', 'monthly'),
          _planButton('Annual', '৳2,999', 'annual'),
        ])),
        const SizedBox(height: 18),
        OutlinedButton.icon(
            onPressed: () async => widget.auth.signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
            style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.terra,
                padding: const EdgeInsets.all(14)))
      ]);

  Map<String, dynamic> get _user => widget.auth.user ?? {};
  Future<void> _editProfile() async {
    final controller =
        TextEditingController(text: (_user['name'] ?? '').toString());
    final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
                title: const Text('Edit profile'),
                content: TextField(
                    controller: controller,
                    maxLength: 80,
                    decoration: const InputDecoration(labelText: 'Name')),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel')),
                  FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Save'))
                ]));
    if (ok != true || !mounted) return;
    try {
      await widget.auth.updateProfile({'name': controller.text.trim()});
      if (mounted) _message('Profile updated');
    } catch (e) {
      if (mounted) _message(ApiClient.messageFrom(e));
    }
    controller.dispose();
  }

  Widget _planButton(String label, String price, String plan) => ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: FilledButton.tonal(
          onPressed: () => _startPayment(plan),
          child: Text(price),
        ),
      );

  Future<void> _startPayment(String plan) async {
    try {
      final data = Map<String, dynamic>.from(await widget.auth.api
          .post('/payments/start', body: {'plan': plan}) as Map);
      final checkout = Uri.parse(data['redirectUrl'] as String);
      if (!await launchUrl(checkout, mode: LaunchMode.externalApplication)) {
        throw const ApiException('Could not open the secure checkout page.');
      }
      if (mounted) {
        _message(
            'Complete checkout in your browser. Your plan updates after payment verification.');
      }
    } catch (error) {
      if (mounted) _message(ApiClient.messageFrom(error));
    }
  }

  Future<void> _showNotifications(BuildContext context) async {
    await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (ctx) => SafeArea(
            child: SizedBox(
                height: 430,
                child: Column(children: [
                  Padding(
                      padding: const EdgeInsets.all(18),
                      child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Notifications',
                                style: Theme.of(ctx)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(fontWeight: FontWeight.w800)),
                            TextButton(
                                onPressed: () async {
                                  try {
                                    await widget.auth.api
                                        .patch('/notifications/read-all');
                                    await _load();
                                    if (ctx.mounted) Navigator.pop(ctx);
                                  } catch (e) {
                                    if (ctx.mounted) {
                                      ScaffoldMessenger.of(ctx).showSnackBar(
                                          SnackBar(
                                              content: Text(
                                                  ApiClient.messageFrom(e))));
                                    }
                                  }
                                },
                                child: const Text('Mark all read'))
                          ])),
                  Expanded(
                      child: _notifications.isEmpty
                          ? const Center(child: Text('You’re all caught up.'))
                          : ListView(
                              children: _notifications.map((raw) {
                              final n = Map<String, dynamic>.from(raw as Map);
                              return ListTile(
                                  leading: const Icon(Icons.campaign_outlined,
                                      color: AppColors.terra),
                                  title:
                                      Text((n['title'] ?? 'Update').toString()),
                                  subtitle: Text(
                                      (n['message'] ?? n['body'] ?? '')
                                          .toString()),
                                  onTap: () async {
                                    final id = (n['_id'] ?? n['id']).toString();
                                    try {
                                      await widget.auth.api
                                          .patch('/notifications/$id/read');
                                      await _load();
                                    } catch (_) {}
                                  });
                            }).toList()))
                ]))));
  }

  Future<void> _addEntry() async {
    List<dynamic> categories;
    try {
      categories = await widget.auth.api.get('/categories') as List<dynamic>;
    } catch (e) {
      _message(ApiClient.messageFrom(e));
      return;
    }
    if (categories.isEmpty) {
      _message('Add a category in the web app before recording a transaction.');
      return;
    }
    if (!mounted) return;
    await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (ctx) => _EntryForm(
            api: widget.auth.api,
            categories: categories,
            onSaved: () {
              Navigator.pop(ctx);
              _load();
            }));
  }

  String _greeting() {
    final name = (_user['name'] ?? 'there').toString().split(' ').first;
    return 'Hello, $name';
  }

  String _monthLabel() => '${_monthName(_now.month)} ${_now.year}';
  String _monthName(int month) => const [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ][month - 1];
  double _number(dynamic value) =>
      (value as num?)?.toDouble() ?? double.tryParse('$value') ?? 0;
  double _ratio(double a, double b) =>
      b <= 0 ? 0 : (a / b).clamp(0, 1).toDouble();
  String _money(double amount) => '৳${amount.toStringAsFixed(0)}';
  Widget _whiteMetric(String label, dynamic amount) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 4),
        Text(_money(_number(amount)),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17))
      ]);
  Widget _sectionTitle(String text, {String? action, VoidCallback? onAction}) =>
      Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child:
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(text,
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            if (action != null)
              TextButton(onPressed: onAction, child: Text(action))
          ]));
  Widget _card(Widget child) => Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.paperMist)),
      child: child);
  Widget _emptyCard(String text) => _card(Row(children: [
        const Icon(Icons.auto_awesome_outlined, color: AppColors.sage),
        const SizedBox(width: 12),
        Expanded(
            child: Text(text, style: const TextStyle(color: Colors.black54)))
      ]));
  void _message(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
}

class _EntryForm extends StatefulWidget {
  const _EntryForm(
      {required this.api, required this.categories, required this.onSaved});
  final ApiClient api;
  final List<dynamic> categories;
  final VoidCallback onSaved;
  @override
  State<_EntryForm> createState() => _EntryFormState();
}

class _EntryFormState extends State<_EntryForm> {
  final _amount = TextEditingController();
  final _note = TextEditingController();
  final _form = GlobalKey<FormState>();
  String _type = 'expense';
  String? _categoryId;
  String _source = 'cash';
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final available =
        widget.categories.where((v) => (v as Map)['type'] == _type).toList();
    if (_categoryId != null &&
        !available.any((v) => (v as Map)['_id'].toString() == _categoryId)) {
      _categoryId = null;
    }
    return Padding(
        padding: EdgeInsets.fromLTRB(
            20, 8, 20, MediaQuery.viewInsetsOf(context).bottom + 20),
        child: Form(
            key: _form,
            child: ListView(shrinkWrap: true, children: [
              Text('New transaction',
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 18),
              DropdownButtonFormField<String>(
                  initialValue: _type,
                  decoration: const InputDecoration(
                      labelText: 'Type', border: OutlineInputBorder()),
                  items: const [
                    'income',
                    'expense',
                    'savings',
                    'investment',
                    'payable',
                    'receivable'
                  ]
                      .map((x) => DropdownMenuItem(
                          value: x,
                          child: Text(x[0].toUpperCase() + x.substring(1))))
                      .toList(),
                  onChanged: (v) => setState(() {
                        _type = v!;
                        _categoryId = null;
                      })),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                  initialValue: _categoryId,
                  decoration: const InputDecoration(
                      labelText: 'Category', border: OutlineInputBorder()),
                  items: available.map((raw) {
                    final c = Map<String, dynamic>.from(raw as Map);
                    return DropdownMenuItem(
                        value: c['_id'].toString(),
                        child: Text('${c['icon'] ?? '📦'}  ${c['name']}'));
                  }).toList(),
                  onChanged: (v) => setState(() => _categoryId = v),
                  validator: (v) => v == null
                      ? 'Choose a category for this transaction'
                      : null),
              const SizedBox(height: 14),
              TextFormField(
                  controller: _amount,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                      labelText: 'Amount (BDT)',
                      prefixText: '৳ ',
                      border: OutlineInputBorder()),
                  validator: (v) =>
                      double.tryParse(v ?? '') == null || double.parse(v!) <= 0
                          ? 'Enter an amount greater than zero'
                          : null),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                  initialValue: _source,
                  decoration: const InputDecoration(
                      labelText: 'Payment method',
                      border: OutlineInputBorder()),
                  items: const {
                    'cash': 'Cash',
                    'bank': 'Bank',
                    'bkash': 'bKash',
                    'nagad': 'Nagad',
                    'card': 'Card',
                    'other': 'Other'
                  }
                      .entries
                      .map((e) =>
                          DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => _source = v!)),
              const SizedBox(height: 14),
              TextFormField(
                  controller: _note,
                  maxLength: 300,
                  decoration: const InputDecoration(
                      labelText: 'Note (optional)',
                      border: OutlineInputBorder())),
              if (_error != null)
                Text(_error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              const SizedBox(height: 12),
              FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? const CircularProgressIndicator()
                      : const Text('Save transaction'))
            ])));
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.api.post('/entries', body: {
        'type': _type,
        'amount': double.parse(_amount.text),
        'categoryId': _categoryId,
        'source': _source,
        'note': _note.text.trim(),
        'date': DateTime.now().toIso8601String()
      });
      widget.onSaved();
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = ApiClient.messageFrom(e);
        });
      }
    }
  }
}
