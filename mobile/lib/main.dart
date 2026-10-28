import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/config/app_config.dart';
import 'core/constants/app_colors.dart';
import 'core/localization/app_locale.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_screen.dart';
import 'features/shell/app_shell.dart';
import 'shared/data/api_client.dart';
import 'shared/data/auth_repository.dart';
import 'shared/data/finance_repository.dart';
import 'shared/widgets/loading_overlay.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Brand system UI
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.ink,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  const storage = FlutterSecureStorage();
  final config = AppConfig(storage);
  await config.initialize();

  // URL is fixed after initialize() — release→production, debug→local.
  final api = ApiClient(storage, baseUrl: config.currentBaseUrl);

  final auth = AuthRepository(api, storage);
  final financeRepo = FinanceRepository(api);
  final appLocale = AppLocale(storage);

  runApp(AbmitiApp(
    auth: auth,
    financeRepo: financeRepo,
    appLocale: appLocale,
    config: config,
    apiClient: api,
  ));
}


class AbmitiApp extends StatefulWidget {
  const AbmitiApp({
    super.key,
    required this.auth,
    required this.financeRepo,
    required this.appLocale,
    required this.config,
    required this.apiClient,
  });

  final AuthRepository auth;
  final FinanceRepository financeRepo;
  final AppLocale appLocale;
  final AppConfig config;
  final ApiClient apiClient;

  @override
  State<AbmitiApp> createState() => _AbmitiAppState();
}

class _AbmitiAppState extends State<AbmitiApp> {
  bool _restoring = true;

  @override
  void initState() {
    super.initState();
    widget.auth.restore().whenComplete(() {
      if (mounted) setState(() => _restoring = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return LocaleScope(
      locale: widget.appLocale,
      child: AnimatedBuilder(
        animation: widget.appLocale,
        builder: (context, _) => MaterialApp(
          title: widget.appLocale.isBengali
              ? 'অবমিতি — আয় ব্যয় মিতি'
              : 'Abmiti — Personal Finance',
          locale: widget.appLocale.locale,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: ThemeMode.system,
          home: _restoring
              ? const Scaffold(body: LoadingOverlay())
              : AnimatedBuilder(
                  animation: widget.auth,
                  builder: (context, _) => widget.auth.user == null
                      ? AuthScreen(
                          auth: widget.auth,
                          config: widget.config,
                          apiClient: widget.apiClient,
                        )
                      : AppShell(
                          auth: widget.auth,
                          financeRepo: widget.financeRepo,
                          config: widget.config,
                          apiClient: widget.apiClient,
                        ),
                ),
        ),
      ),
    );
  }
}
