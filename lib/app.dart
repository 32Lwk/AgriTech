import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/auth/auth_gate.dart';
import 'screens/shell/app_shell.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';

class AgriMatchApp extends StatelessWidget {
  const AgriMatchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState()..initialize(),
      child: MaterialApp(
        title: 'Agri Match Demo',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const _AppBootstrapGate(),
      ),
    );
  }
}

class _AppBootstrapGate extends StatelessWidget {
  const _AppBootstrapGate();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (!state.isInitialized) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        if (!state.isAuthenticated) {
          return const AuthGateScreen();
        }
        return const AppShell();
      },
    );
  }
}

