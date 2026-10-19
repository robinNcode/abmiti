import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.auth});
  final AuthRepository auth;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _registering = false;
  bool _busy = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_registering) {
        await widget.auth
            .register(_name.text.trim(), _email.text.trim(), _password.text);
      } else {
        await widget.auth.signIn(_email.text.trim(), _password.text);
      }
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.messageFrom(e));
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
            child: Center(
                child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 440),
                      child: Form(
                          key: _form,
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Container(
                                    width: 72,
                                    height: 72,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                        color: AppColors.terra,
                                        borderRadius:
                                            BorderRadius.circular(24)),
                                    child: const Icon(
                                        Icons.account_balance_wallet_rounded,
                                        color: Colors.white,
                                        size: 38)),
                                const SizedBox(height: 24),
                                Text(
                                    _registering
                                        ? 'Start with clarity'
                                        : 'Welcome to Abmiti',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineMedium
                                        ?.copyWith(
                                            fontWeight: FontWeight.w800)),
                                const SizedBox(height: 8),
                                Text(
                                    _registering
                                        ? 'Create your account and build healthier money habits.'
                                        : 'Your money, in balance.',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(color: Colors.black54)),
                                const SizedBox(height: 30),
                                if (_registering) ...[
                                  _field(
                                      _name, 'Full name', Icons.person_outline,
                                      validator: (v) => (v == null ||
                                              v.trim().isEmpty ||
                                              v.length > 80)
                                          ? 'Enter your name (up to 80 characters)'
                                          : null),
                                  const SizedBox(height: 16)
                                ],
                                _field(
                                    _email, 'Email address', Icons.mail_outline,
                                    keyboard: TextInputType.emailAddress,
                                    validator: (v) => v != null &&
                                            RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                                .hasMatch(v)
                                        ? null
                                        : 'Enter a valid email address'),
                                const SizedBox(height: 16),
                                _field(
                                    _password, 'Password', Icons.lock_outline,
                                    obscure: !_showPassword,
                                    suffix: IconButton(
                                        onPressed: () => setState(() =>
                                            _showPassword = !_showPassword),
                                        icon: Icon(_showPassword
                                            ? Icons.visibility_off
                                            : Icons.visibility)),
                                    validator: (v) => v == null || v.length < 6
                                        ? 'Use at least 6 characters'
                                        : null),
                                if (_error != null) ...[
                                  const SizedBox(height: 16),
                                  Text(_error!,
                                      style: TextStyle(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .error))
                                ],
                                const SizedBox(height: 24),
                                FilledButton(
                                    onPressed: _busy ? null : _submit,
                                    style: FilledButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 16)),
                                    child: _busy
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                                strokeWidth: 2))
                                        : Text(_registering
                                            ? 'Create account'
                                            : 'Sign in')),
                                const SizedBox(height: 12),
                                TextButton(
                                    onPressed: _busy
                                        ? null
                                        : () => setState(() {
                                              _registering = !_registering;
                                              _error = null;
                                            }),
                                    child: Text(_registering
                                        ? 'Already have an account? Sign in'
                                        : 'New to Abmiti? Create an account')),
                              ])),
                    )))),
      );

  Widget _field(TextEditingController controller, String label, IconData icon,
          {TextInputType? keyboard,
          bool obscure = false,
          Widget? suffix,
          String? Function(String?)? validator}) =>
      TextFormField(
        controller: controller,
        keyboardType: keyboard,
        obscureText: obscure,
        validator: validator,
        textInputAction: TextInputAction.next,
        decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon),
            suffixIcon: suffix,
            border:
                OutlineInputBorder(borderRadius: BorderRadius.circular(16))),
      );
}
