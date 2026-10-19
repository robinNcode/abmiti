import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/constants/app_colors.dart';
import 'features/auth/auth_screen.dart';
import 'features/home/home_screen.dart';
import 'shared/data/api_client.dart';
import 'shared/data/auth_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Brand the system UI
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: AppColors.paper,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.ink,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  const storage = FlutterSecureStorage();
  final api = ApiClient(storage);
  runApp(AbmitiApp(auth: AuthRepository(api, storage)));
}

class AbmitiApp extends StatefulWidget {
  const AbmitiApp({super.key, required this.auth});
  final AuthRepository auth;

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
    return MaterialApp(
      title: 'অবমিতি — Abmiti',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.terra,
          brightness: Brightness.light,
          primary: AppColors.terra,
          onPrimary: AppColors.paper,
          secondary: AppColors.sage,
          onSecondary: AppColors.paper,
          surface: AppColors.paper,
          onSurface: AppColors.ink,
        ),
        scaffoldBackgroundColor: AppColors.paper,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.terra,
          foregroundColor: AppColors.paper,
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: AppColors.paper,
            statusBarIconBrightness: Brightness.dark,
            statusBarBrightness: Brightness.light,
          ),
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: AppColors.terraDark,
          contentTextStyle: TextStyle(
            color: AppColors.paper,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      home: _restoring
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : AnimatedBuilder(
              animation: widget.auth,
              builder: (context, _) => widget.auth.user == null
                  ? AuthScreen(auth: widget.auth)
                  : HomeScreen(auth: widget.auth),
            ),
    );
  }
}
