import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/finance_repository.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/shimmer_loading.dart';
import '../../shared/widgets/smart_bottom_nav_bar.dart';

double payableAmountValue(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value.trim()) ?? fallback;
  return fallback;
}

double receivableAmountValue(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value.trim()) ?? fallback;
  return fallback;
}

class PayablesScreen extends StatefulWidget {
  const PayablesScreen({super.key, required this.financeRepo});

  final FinanceRepository financeRepo;

  @override
  State<PayablesScreen> createState() => _PayablesScreenState();
}

class _PayablesScreenState extends State<PayablesScreen> {
  String _filter = 'open'; // 'open', 'settled', 'cancelled', 'all'
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _payables = [];
  List<Map<String, dynamic>> _accounts = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final payablesFuture = widget.financeRepo.fetchPayables(
        status: _filter == 'all' ? null : _filter,
      );
      final accountsFuture = widget.financeRepo.fetchAccounts();

      final results = await Future.wait([payablesFuture, accountsFuture]);

      if (mounted) {
        setState(() {
          _payables = results[0];
          _accounts = results[1];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = ApiClient.messageFrom(e);
          _loading = false;
        });
      }
    }
  }

  bool _isOverdue(Map<String, dynamic> item) {
    if (item['status']?.toString() != 'open') return false;
    final dueStr = item['dueDate'] ?? item['due_date'];
    if (dueStr == null) return false;
    try {
      final due = DateTime.parse(dueStr.toString());
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      return due.isBefore(today);
    } catch (_) {
      return false;
    }
  }

  void _showAddPayableDialog() {
    final loc = context.appLocale;
    final counterpartyCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    String kind = 'borrowed_cash';
    String? selectedAccountId;
    DateTime? dueDate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.paper,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        loc.tr('add_payable'),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: counterpartyCtrl,
                    decoration: InputDecoration(
                      labelText: '${loc.tr('counterparty')} *',
                      hintText: 'e.g. Bank, Rahim, Landlord',
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: amountCtrl,
                          keyboardType: const TextInputType.numberWithOptions(
                              decimal: true),
                          decoration: InputDecoration(
                            labelText: '${loc.tr('principal')} (৳) *',
                            hintText: '0.00',
                            filled: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: kind,
                          decoration: InputDecoration(
                            labelText: loc.tr('category_type'),
                            filled: true,
                          ),
                          items: [
                            DropdownMenuItem(
                              value: 'borrowed_cash',
                              child: Text(
                                loc.tr('borrowed_cash'),
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'unpaid_expense',
                              child: Text(
                                loc.tr('unpaid_expense'),
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                          ],
                          onChanged: (val) {
                            if (val != null) setModalState(() => kind = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  if (kind == 'borrowed_cash' && _accounts.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      initialValue: selectedAccountId,
                      decoration: const InputDecoration(
                        labelText: 'Credit To Account',
                        filled: true,
                      ),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('None / Cash'),
                        ),
                        ..._accounts.map(
                          (acc) => DropdownMenuItem(
                            value: (acc['_id'] ?? acc['id'])?.toString(),
                            child: Text(acc['name']?.toString() ?? 'Account'),
                          ),
                        ),
                      ],
                      onChanged: (val) =>
                          setModalState(() => selectedAccountId = val),
                    ),
                  ],
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      dueDate == null
                          ? '${loc.tr('due_date')} (Optional)'
                          : '${loc.tr('due_date')}: ${dueDate!.day}/${dueDate!.month}/${dueDate!.year}',
                      style: TextStyle(
                        fontSize: 13,
                        color: dueDate == null ? Colors.grey : AppColors.terra,
                        fontWeight: dueDate == null
                            ? FontWeight.normal
                            : FontWeight.w700,
                      ),
                    ),
                    trailing:
                        const Icon(Icons.calendar_today_rounded, size: 20),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate:
                            DateTime.now().add(const Duration(days: 30)),
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 365)),
                        lastDate:
                            DateTime.now().add(const Duration(days: 3650)),
                      );
                      if (picked != null) {
                        setModalState(() => dueDate = picked);
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: noteCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Note (Optional)',
                      hintText: 'Notes...',
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.terra,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () async {
                      final name = counterpartyCtrl.text.trim();
                      final amt = double.tryParse(amountCtrl.text.trim()) ?? 0;
                      if (name.isEmpty || amt <= 0) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content:
                                  Text('Please enter name and valid amount')),
                        );
                        return;
                      }

                      Navigator.pop(ctx);
                      try {
                        await widget.financeRepo.createPayable({
                          'counterparty': name,
                          'principal': amt,
                          'kind': kind,
                          if (selectedAccountId != null)
                            'accountId': selectedAccountId,
                          if (dueDate != null)
                            'dueDate': dueDate!.toIso8601String(),
                          if (noteCtrl.text.trim().isNotEmpty)
                            'note': noteCtrl.text.trim(),
                        });
                        _loadData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(ApiClient.messageFrom(e))),
                          );
                        }
                      }
                    },
                    child: Text(
                      loc.tr('add_payable'),
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showPayDialog(Map<String, dynamic> payable) {
    final loc = context.appLocale;
    final payableId = (payable['_id'] ?? payable['id'])?.toString() ?? '';
    final principal = payableAmountValue(payable['principal']);
    final paid =
        payableAmountValue(payable['paidAmount'] ?? payable['paid_amount']);
    final remaining = payableAmountValue(
      payable['remaining'],
      fallback: principal - paid,
    );

    final amountCtrl =
        TextEditingController(text: remaining.toStringAsFixed(0));
    final noteCtrl = TextEditingController();
    String source = 'bank';
    String? selectedAccountId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.paper,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${loc.tr('settle_pay')}: ${payable['counterparty'] ?? ''}',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.terra.withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          loc.tr('remaining'),
                          style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          '৳${remaining.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppColors.terra,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextField(
                    controller: amountCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: '${loc.tr('principal')} (৳) *',
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: source,
                    decoration: const InputDecoration(
                      labelText: 'Payment Source',
                      filled: true,
                    ),
                    items: const [
                      DropdownMenuItem(value: 'bank', child: Text('Bank')),
                      DropdownMenuItem(value: 'bkash', child: Text('bKash')),
                      DropdownMenuItem(value: 'nagad', child: Text('Nagad')),
                      DropdownMenuItem(value: 'cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'card', child: Text('Card')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => source = val);
                    },
                  ),
                  if (_accounts.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      initialValue: selectedAccountId,
                      decoration: const InputDecoration(
                        labelText: 'From Account (Optional)',
                        filled: true,
                      ),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('None / Default'),
                        ),
                        ..._accounts.map(
                          (acc) => DropdownMenuItem(
                            value: (acc['_id'] ?? acc['id'])?.toString(),
                            child: Text(acc['name']?.toString() ?? 'Account'),
                          ),
                        ),
                      ],
                      onChanged: (val) =>
                          setModalState(() => selectedAccountId = val),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: noteCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Note (Optional)',
                      hintText: 'e.g. Installment 1',
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.terra,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () async {
                      final amt = double.tryParse(amountCtrl.text.trim()) ?? 0;
                      if (amt <= 0 || amt > remaining) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                                'Payment amount cannot exceed remaining balance'),
                          ),
                        );
                        return;
                      }

                      Navigator.pop(ctx);
                      try {
                        await widget.financeRepo.payPayable(payableId, {
                          'amount': amt,
                          'source': source,
                          if (selectedAccountId != null)
                            'accountId': selectedAccountId,
                          if (noteCtrl.text.trim().isNotEmpty)
                            'note': noteCtrl.text.trim(),
                        });
                        _loadData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(ApiClient.messageFrom(e))),
                          );
                        }
                      }
                    },
                    child: Text(
                      loc.tr('settle_pay'),
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showDetailBottomSheet(Map<String, dynamic> item) async {
    final payableId = (item['_id'] ?? item['id'])?.toString() ?? '';
    final loc = context.appLocale;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FutureBuilder<Map<String, dynamic>>(
        future: widget.financeRepo.fetchPayableDetail(payableId),
        builder: (ctx, snapshot) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          final detail = snapshot.data ?? item;
          final payments = (detail['payments'] as List?) ?? [];
          final principal = payableAmountValue(detail['principal']);
          final paid =
              payableAmountValue(detail['paidAmount'] ?? detail['paid_amount']);
          final remaining = payableAmountValue(
            detail['remaining'],
            fallback: principal - paid,
          );
          final status = detail['status']?.toString() ?? 'open';

          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.paper,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          detail['counterparty']?.toString() ?? 'Payable',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color:
                          isDark ? AppColors.darkElevated : AppColors.paperMist,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(loc.tr('principal'),
                                style: const TextStyle(fontSize: 12)),
                            Text('৳${principal.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(loc.tr('paid'),
                                style: const TextStyle(fontSize: 12)),
                            Text('৳${paid.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.sage)),
                          ],
                        ),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(loc.tr('remaining'),
                                style: const TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.bold)),
                            Text('৳${remaining.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.terra)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    loc.tr('history_installments'),
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  if (payments.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        'No payment entries linked yet.',
                        style: TextStyle(
                            fontSize: 12, color: Colors.grey.shade500),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else
                    ...payments.map((p) {
                      final amt = payableAmountValue(p['amount']);
                      final date = p['date']?.toString() ?? '';
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const CircleAvatar(
                          radius: 14,
                          backgroundColor: AppColors.terra,
                          child: Icon(Icons.arrow_upward_rounded,
                              size: 14, color: Colors.white),
                        ),
                        title: Text('৳${amt.toStringAsFixed(0)}',
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                            '${p['source'] ?? ''} • ${date.split('T').first}'),
                      );
                    }),
                  if (status == 'open' && paid == 0) ...[
                    const SizedBox(height: 16),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: const BorderSide(color: AppColors.danger),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        try {
                          await widget.financeRepo.cancelPayable(payableId);
                          _loadData();
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(ApiClient.messageFrom(e))),
                            );
                          }
                        }
                      },
                      child: const Text('Cancel Payable'),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final openList = _payables.filter((p) => p['status']?.toString() == 'open');
    final totalRemaining = openList.fold<double>(
      0.0,
      (sum, p) =>
          sum +
          payableAmountValue(
            p['remaining'],
            fallback: payableAmountValue(p['principal']) -
                payableAmountValue(p['paidAmount'] ?? p['paid_amount']),
          ),
    );
    final overdueCount = openList.where(_isOverdue).length;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          loc.tr('nav_payables'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: loc.tr('add_payable'),
            onPressed: _showAddPayableDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Summary Cards
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.terra.withAlpha(20),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.terra.withAlpha(60)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          loc.tr('total_outstanding'),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white70 : AppColors.inkLight,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '৳${totalRemaining.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: AppColors.terra,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.mustard.withAlpha(20),
                      borderRadius: BorderRadius.circular(16),
                      border:
                          Border.all(color: AppColors.mustard.withAlpha(60)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          loc.tr('overdue_count'),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white70 : AppColors.inkLight,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '$overdueCount',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: AppColors.mustard,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Filter Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['open', 'settled', 'cancelled', 'all'].map((status) {
                  final selected = _filter == status;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        status == 'open'
                            ? loc.tr('status_open')
                            : status == 'settled'
                                ? loc.tr('status_settled')
                                : status == 'cancelled'
                                    ? loc.tr('status_cancelled')
                                    : loc.tr('filter_all'),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight:
                              selected ? FontWeight.w800 : FontWeight.w500,
                          color: selected
                              ? Colors.white
                              : (isDark ? Colors.white70 : AppColors.ink),
                        ),
                      ),
                      selected: selected,
                      selectedColor: AppColors.ink,
                      backgroundColor:
                          isDark ? AppColors.darkElevated : AppColors.paperMist,
                      onSelected: (val) {
                        if (val) {
                          setState(() => _filter = status);
                          _loadData();
                        }
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),

            if (_loading)
              const ShimmerLoading(count: 4)
            else if (_error != null)
              ErrorState(message: _error!, onRetry: _loadData)
            else if (_payables.isEmpty)
              EmptyState(
                icon: Icons.credit_card_off_rounded,
                title: loc.tr('no_payables_found'),
                subtitle: 'No payables matching this status.',
                actionLabel: loc.tr('add_payable'),
                action: _showAddPayableDialog,
              )
            else
              ..._payables.map((item) {
                final principal = payableAmountValue(item['principal']);
                final paid = payableAmountValue(
                    item['paidAmount'] ?? item['paid_amount']);
                final remaining = payableAmountValue(
                  item['remaining'],
                  fallback: principal - paid,
                );
                final status = item['status']?.toString() ?? 'open';
                final isOverdue = _isOverdue(item);
                final progress =
                    principal > 0 ? (paid / principal).clamp(0.0, 1.0) : 0.0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.paperCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isOverdue
                          ? AppColors.danger.withAlpha(120)
                          : status == 'settled'
                              ? AppColors.sage.withAlpha(60)
                              : isDark
                                  ? AppColors.darkElevated
                                  : AppColors.paperMist,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item['counterparty']?.toString() ?? 'Payable',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isOverdue
                                  ? AppColors.danger.withAlpha(30)
                                  : status == 'settled'
                                      ? AppColors.sage.withAlpha(30)
                                      : AppColors.terra.withAlpha(30),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isOverdue
                                  ? loc.tr('overdue_count')
                                  : status.toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: isOverdue
                                    ? AppColors.danger
                                    : status == 'settled'
                                        ? AppColors.sage
                                        : AppColors.terra,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${loc.tr('remaining')}: ৳${remaining.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: AppColors.terra,
                            ),
                          ),
                          Text(
                            '৳${paid.toStringAsFixed(0)} / ৳${principal.toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 11,
                              color:
                                  isDark ? Colors.white60 : AppColors.inkLight,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: isDark
                              ? AppColors.darkElevated
                              : AppColors.paperMist,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            status == 'settled'
                                ? AppColors.sage
                                : AppColors.terra,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton.icon(
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            icon: const Icon(Icons.history_rounded, size: 16),
                            label: const Text('Details',
                                style: TextStyle(fontSize: 12)),
                            onPressed: () => _showDetailBottomSheet(item),
                          ),
                          if (status == 'open')
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.terra,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              icon: const Icon(Icons.payment_rounded, size: 14),
                              label: Text(
                                loc.tr('settle_pay'),
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w800),
                              ),
                              onPressed: () => _showPayDialog(item),
                            ),
                        ],
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
      bottomNavigationBar: SmartBottomNavBar(
        items: [
          _CompactNavItem(
            icon: Icons.home_rounded,
            label: loc.tr('nav_overview'),
            active: true,
            isDark: isDark,
            onTap: () => Navigator.of(context).maybePop(),
          ),
          _CompactNavItem(
            icon: Icons.receipt_long_rounded,
            label: loc.tr('nav_activity'),
            active: false,
            isDark: isDark,
            onTap: () => Navigator.of(context).maybePop(),
          ),
        ],
        onTap: (index) {
          if (index == 0) {
            Navigator.of(context).maybePop();
          }
        },
        onCenterTap: _showAddPayableDialog,
        centerAction: const Icon(Icons.add_rounded, size: 30, color: Colors.white),
      ),
    );
  }
}

class _CompactNavItem extends StatelessWidget {
  const _CompactNavItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final foreground = active ? Colors.white : (isDark ? Colors.white70 : AppColors.ink);
    final labelColor = active ? AppColors.terra : (isDark ? Colors.white70 : AppColors.inkLight);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: foreground),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: labelColor,
                fontSize: 10,
                fontWeight: active ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

extension _IterableExt<T> on Iterable<T> {
  List<T> filter(bool Function(T) test) => where(test).toList();
}
