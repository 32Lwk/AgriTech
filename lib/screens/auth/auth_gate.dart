import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';

class AuthGateScreen extends StatelessWidget {
  const AuthGateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = context.watch<AppState>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ようこそ！',
                style: theme.textTheme.headlineLarge?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '農家×学生マッチングの価値交換体験をデモでご覧いただけます。まずはゲストログインから始めましょう。',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              _PersonaCard(
                icon: Icons.agriculture,
                title: '農家（田中さん）',
                description: '募集作成と学生承認の流れをモック体験できます。',
              ),
              const SizedBox(height: 16),
              _PersonaCard(
                icon: Icons.school,
                title: '学生（佐藤さん）',
                description: '検索→応募→チェックイン→マイル獲得の一連を体験。',
              ),
              const SizedBox(height: 16),
              _PersonaCard(
                icon: Icons.support_agent,
                title: '運営（中村さん）',
                description: 'チャット承認やフォロー通知の演出を確認。',
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: state.isAuthenticated
                    ? null
                    : () async {
                        await context.read<AppState>().signInAnonymously();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('ゲストログインしました'),
                            ),
                          );
                        }
                      },
                icon: const Icon(Icons.login),
                label: const Text('ゲストログインで体験開始'),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Googleログインはデモでは疑似的に省略しています。'),
                    ),
                  );
                },
                icon: const Icon(Icons.account_circle),
                label: const Text('Googleアカウントでログイン（デモ表示のみ）'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PersonaCard extends StatelessWidget {
  const _PersonaCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              size: 32,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

