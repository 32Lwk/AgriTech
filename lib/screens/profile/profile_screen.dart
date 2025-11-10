import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import 'tutorial_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('マイページ'),
      ),
      body: ListView(
        children: [
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(
                          Icons.person,
                          size: 32,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '佐藤さん（学生）',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'ゲストログイン中',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'マイル残高：${state.currentMiles} pt',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.menu_book),
            title: const Text('チュートリアルを見る'),
            subtitle: const Text('ペルソナ別の体験ガイドを確認できます'),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const TutorialScreen(),
                ),
              );
            },
          ),
          const Divider(height: 0),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('省略機能と今後のアップデート'),
            onTap: () {
              showDialog<void>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('将来のアップデート予定'),
                  content: const Text(
                    '・決済・本人確認は本番ではFirebase Extensionsや外部APIで実装予定\n'
                    '・通知はFirebase Cloud Messagingを利用する想定\n'
                    '・運用時はFirestoreとCloud Functionsでデータ連携を強化\n',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('閉じる'),
                    ),
                  ],
                ),
              );
            },
          ),
          const Divider(height: 0),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('ログアウト'),
            onTap: () {
              context.read<AppState>().signOut();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('ログアウトしました。ログイン画面に戻ります。')),
              );
            },
          ),
        ],
      ),
    );
  }
}

