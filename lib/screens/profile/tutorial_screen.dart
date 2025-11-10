import 'package:flutter/material.dart';

class TutorialScreen extends StatefulWidget {
  const TutorialScreen({super.key});

  @override
  State<TutorialScreen> createState() => _TutorialScreenState();
}

class _TutorialScreenState extends State<TutorialScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  final List<_TutorialPageData> _pages = const [
    _TutorialPageData(
      title: '学生：応募〜承認',
      description:
          'ホームで募集カードを確認し、応募ボタンで体験を開始。運営からのチャット通知で承認状況を確認できます。',
      icon: Icons.school,
      highlight: '検索→応募→承認までを1画面で説明',
    ),
    _TutorialPageData(
      title: '現地チェックイン',
      description:
          '集合場所でQRまたはGPSボタンをタップするとチェックイン済みに。作業進捗がタイムラインで更新されます。',
      icon: Icons.qr_code_scanner,
      highlight: 'チェックイン演出や通知の見せ方を指南',
    ),
    _TutorialPageData(
      title: 'マイル活用＆予約',
      description:
          '作業完了でマイルが付与され、ダッシュボードに推移グラフが表示。スタジオ予約でマイルを活用できます。',
      icon: Icons.bar_chart,
      highlight: 'マイル可視化と予約体験を説明',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final index = _controller.page?.round() ?? 0;
      if (index != _currentIndex) {
        setState(() => _currentIndex = index);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('デモチュートリアル'),
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: _pages.length,
              itemBuilder: (context, index) {
                final page = _pages[index];
                return Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(
                          page.icon,
                          size: 48,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        page.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        page.description,
                        style: Theme.of(context).textTheme.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.secondaryContainer,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lightbulb_outline),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                page.highlight,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _pages.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _currentIndex ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == _currentIndex
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TutorialPageData {
  const _TutorialPageData({
    required this.title,
    required this.description,
    required this.icon,
    required this.highlight,
  });

  final String title;
  final String description;
  final IconData icon;
  final String highlight;
}

