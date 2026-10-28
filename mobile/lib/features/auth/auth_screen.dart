import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_locale.dart';
import '../../shared/data/api_client.dart';
import '../../shared/data/auth_repository.dart';
import 'google_auth_webview.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.auth,
  });

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
  bool _googleBusy = false;
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

  Future<void> _handleGoogleAuth() async {
    setState(() {
      _googleBusy = true;
      _error = null;
    });

    try {
      final backendBase = widget.auth.apiClient.currentBaseUrl
          .replaceAll(RegExp(r'/+$'), '');
      final authUrl = '$backendBase/auth/google';

      final tokens = await GoogleAuthWebView.start(context, authUrl: authUrl);
      if (tokens != null) {
        await widget.auth.signInWithTokens(tokens.accessToken, tokens.refreshToken);
      }
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.messageFrom(e));
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.appLocale;
    return Scaffold(
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
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        width: 72,
                        height: 72,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.terra,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Colors.white,
                          size: 38,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      _registering
                          ? loc.tr('auth_register_headline')
                          : loc.tr('auth_welcome'),
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _registering
                          ? loc.tr('auth_register_sub')
                          : loc.tr('auth_welcome_sub'),
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 28),

                    // Google Sign-In / Sign-Up Button
                    OutlinedButton(
                      onPressed: (_busy || _googleBusy) ? null : _handleGoogleAuth,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: Colors.grey.shade300),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _googleBusy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _GoogleLogo(),
                                const SizedBox(width: 12),
                                Text(
                                  loc.tr('auth_continue_google'),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.ink,
                                  ),
                                ),
                              ],
                            ),
                    ),

                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            loc.tr('or_divider'),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                      ],
                    ),
                    const SizedBox(height: 20),

                    if (_registering) ...[
                      _field(
                        _name,
                        loc.tr('auth_full_name'),
                        Icons.person_outline,
                        validator: (v) => (v == null ||
                                v.trim().isEmpty ||
                                v.length > 80)
                            ? loc.tr('auth_name_error')
                            : null,
                      ),
                      const SizedBox(height: 16),
                    ],
                    _field(
                      _email,
                      loc.tr('auth_email'),
                      Icons.mail_outline,
                      keyboard: TextInputType.emailAddress,
                      validator: (v) => v != null &&
                              RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v)
                          ? null
                          : loc.tr('auth_email_error'),
                    ),
                    const SizedBox(height: 16),
                    _field(
                      _password,
                      loc.tr('auth_password'),
                      Icons.lock_outline,
                      obscure: !_showPassword,
                      suffix: IconButton(
                        onPressed: () => setState(
                          () => _showPassword = !_showPassword,
                        ),
                        icon: Icon(
                          _showPassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                      ),
                      validator: (v) => v == null || v.length < 6
                          ? loc.tr('auth_password_error')
                          : null,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: (_busy || _googleBusy) ? null : _submit,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _busy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _registering
                                  ? loc.tr('auth_create_account')
                                  : loc.tr('auth_sign_in'),
                            ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: (_busy || _googleBusy)
                          ? null
                          : () => setState(() {
                                _registering = !_registering;
                                _error = null;
                              }),
                      child: Text(
                        _registering
                            ? loc.tr('auth_have_account')
                            : loc.tr('auth_no_account'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label,
    IconData icon, {
    TextInputType? keyboard,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validator,
  }) =>
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
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        ),
      );
}

class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final center = Offset(w / 2, h / 2);
    final radius = w / 2;

    // Red
    final redPaint = Paint()..color = const Color(0xFFEA4335)..style = PaintingStyle.fill;
    // Blue
    final bluePaint = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;
    // Yellow
    final yellowPaint = Paint()..color = const Color(0xFFFBBC05)..style = PaintingStyle.fill;
    // Green
    final greenPaint = Paint()..color = const Color(0xFF34A853)..style = PaintingStyle.fill;

    // Draw the 4-colored Google 'G' using simplified paths
    final rect = Rect.fromCircle(center: center, radius: radius);
    canvas.drawArc(rect, -0.785, 1.57, true, bluePaint);
    canvas.drawArc(rect, 0.785, 1.57, true, greenPaint);
    canvas.drawArc(rect, 2.356, 1.57, true, yellowPaint);
    canvas.drawArc(rect, 3.927, 1.57, true, redPaint);

    // Inner cutout
    final innerPaint = Paint()..color = Colors.white..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.55, innerPaint);

    // Blue horizontal bar
    final barRect = Rect.fromLTRB(center.dx - 1, center.dy - radius * 0.22, w, center.dy + radius * 0.22);
    canvas.drawRect(barRect, bluePaint);

    // Cutout right gap for G shape
    final gapRect = Rect.fromLTRB(center.dx, center.dy - radius * 0.55, w, center.dy - radius * 0.22);
    canvas.drawRect(gapRect, innerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
