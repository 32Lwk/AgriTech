import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/chat_message.dart';
import '../../data/models/farm_opportunity.dart';
import '../../data/models/photo_log.dart';
import '../../state/app_state.dart';
import '../../widgets/farm_map_preview.dart';

class OpportunityDetailScreen extends StatelessWidget {
  const OpportunityDetailScreen({
    super.key,
    required this.opportunity,
  });

  final FarmOpportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isApplied = state.isApplied(opportunity.id);
    final isApproved = state.isApproved(opportunity.id);
    final isCheckedIn = state.isCheckedIn(opportunity.id);
    final isCompleted = state.isCompleted(opportunity.id);

    return Scaffold(
      appBar: AppBar(
        title: Text(opportunity.title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FarmMapPreview(opportunity: opportunity),
            const SizedBox(height: 20),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                Chip(label: Text('${opportunity.location.prefecture}・${opportunity.location.city}')),
                Chip(label: Text('マイル ${opportunity.rewardMiles}pt')),
                Chip(
                  label: Text(
                    '日程 ${_formatDate(opportunity.workPeriod.startDate)}〜${_formatDate(opportunity.workPeriod.endDate)}',
                  ),
                ),
                Chip(label: Text('募集人数 ${opportunity.requiredStudents}名')),
                for (final tag in opportunity.tags) Chip(label: Text(tag)),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              opportunity.description,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            _StatusTimeline(
              isApplied: isApplied,
              isApproved: isApproved,
              isCheckedIn: isCheckedIn,
              isCompleted: isCompleted,
              lastCheckInAt: state.lastCheckInAt,
            ),
            const SizedBox(height: 24),
            _ActionSection(opportunity: opportunity),
            const SizedBox(height: 32),
            Text(
              '運営からの最新メッセージ',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _MessagePreview(opportunityId: opportunity.id),
            const SizedBox(height: 32),
            _PhotoLogSection(opportunityId: opportunity.id),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
  }
}

class _StatusTimeline extends StatelessWidget {
  const _StatusTimeline({
    required this.isApplied,
    required this.isApproved,
    required this.isCheckedIn,
    required this.isCompleted,
    required this.lastCheckInAt,
  });

  final bool isApplied;
  final bool isApproved;
  final bool isCheckedIn;
  final bool isCompleted;
  final DateTime? lastCheckInAt;

  @override
  Widget build(BuildContext context) {
    final steps = <_TimelineStep>[
      _TimelineStep(
        title: '応募済み',
        isDone: isApplied,
        description: '募集へ応募するとチャットで承認通知が届きます。',
      ),
      _TimelineStep(
        title: '承認完了',
        isDone: isApproved,
        description: '運営ボットから集合時間などが共有されます。',
      ),
      _TimelineStep(
        title: 'チェックイン',
        isDone: isCheckedIn,
        description: lastCheckInAt != null
            ? 'チェックイン完了：${_formatTime(lastCheckInAt!)}'
            : '現地でQR読み込みまたはGPSでチェックインします。',
      ),
      _TimelineStep(
        title: '作業完了・マイル付与',
        isDone: isCompleted,
        description: '完了するとマイルがダッシュボードに反映されます。',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '進行状況',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        for (final step in steps) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                step.isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                color: step.isDone
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.outline,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      step.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      step.description,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (step != steps.last) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Container(
                width: 2,
                height: 24,
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ],
    );
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _TimelineStep {
  const _TimelineStep({
    required this.title,
    required this.description,
    required this.isDone,
  });

  final String title;
  final String description;
  final bool isDone;
}

class _ActionSection extends StatelessWidget {
  const _ActionSection({required this.opportunity});

  final FarmOpportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isApplied = state.isApplied(opportunity.id);
    final isApproved = state.isApproved(opportunity.id);
    final isCheckedIn = state.isCheckedIn(opportunity.id);
    final isCompleted = state.isCompleted(opportunity.id);

    if (!isApplied) {
      return FilledButton.icon(
        onPressed: () async {
          await _runWithLoading(
            context,
            () => context.read<AppState>().applyForOpportunity(opportunity),
            '応募リクエストを送信しています…',
          );
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('「${opportunity.title}」へ応募しました。承認通知をお待ちください。')),
            );
          }
        },
        icon: const Icon(Icons.send),
        label: const Text('この募集に応募する'),
      );
    }

    if (!isApproved) {
      return OutlinedButton.icon(
        onPressed: null,
        icon: const Icon(Icons.hourglass_top),
        label: const Text('承認待ちです'),
      );
    }

    if (!isCheckedIn) {
      return FilledButton.icon(
        onPressed: () async {
          await _runWithLoading(
            context,
            () => context.read<AppState>().completeCheckIn(opportunity.id),
            'チェックイン処理中…',
          );
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('チェックイン完了！作業を開始しました。')),
            );
          }
        },
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('チェックインを実行'),
      );
    }

    if (!isCompleted) {
      return FilledButton.icon(
        onPressed: () async {
          await _runWithLoading(
            context,
            () => context.read<AppState>().completeWork(opportunity.id),
            '作業実績を登録しています…',
          );
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('お疲れさまでした！${opportunity.rewardMiles}マイルが付与されました。'),
              ),
            );
          }
        },
        icon: const Icon(Icons.task_alt),
        label: const Text('作業完了を記録'),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'この募集は完了しています。マイルダッシュボードで成果を確認しましょう。',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.home),
          label: const Text('ホームへ戻る'),
        ),
      ],
    );
  }

  Future<void> _runWithLoading(
    BuildContext context,
    Future<void> Function() action,
    String message,
  ) async {
    final navigator = Navigator.of(context);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _LoadingDialog(message: message),
    );
    try {
      await action();
      await Future<void>.delayed(const Duration(milliseconds: 350));
    } finally {
      if (navigator.canPop()) {
        navigator.pop();
      }
    }
  }
}

class _MessagePreview extends StatelessWidget {
  const _MessagePreview({required this.opportunityId});

  final String opportunityId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final lastMessage = state.chatThread.isEmpty ? null : state.chatThread.last;
    if (lastMessage == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: const Text('まだチャットはありません。'),
      );
    }
    final isOperator = lastMessage.sender == ChatSender.operator;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isOperator
            ? Theme.of(context).colorScheme.primaryContainer
            : Theme.of(context).colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isOperator ? '運営ボット' : 'あなた',
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            lastMessage.content,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _PhotoLogSection extends StatelessWidget {
  const _PhotoLogSection({required this.opportunityId});

  final String opportunityId;

  @override
  Widget build(BuildContext context) {
    final photoLogs = context.watch<AppState>().photoLogs;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '作業フォトログ',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        if (photoLogs.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'まだ写真がありません。作業中の様子を記録してみましょう。',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          )
        else
          Column(
            children: [
              SizedBox(
                height: 160,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: photoLogs.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final log = photoLogs[index];
                    return _PhotoLogCard(log: log);
                  },
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        OutlinedButton.icon(
          onPressed: () async {
            final noteController = TextEditingController();
            final result = await showModalBottomSheet<String>(
              context: context,
              isScrollControlled: true,
              showDragHandle: true,
              builder: (context) {
                return Padding(
                  padding: EdgeInsets.only(
                    left: 20,
                    right: 20,
                    bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                    top: 16,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '写真メモを追加',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: noteController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          hintText: '写真のコメントを入力（例：みんなで収穫中）',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: () {
                          Navigator.of(context).pop(noteController.text.trim());
                        },
                        icon: const Icon(Icons.add_a_photo),
                        label: const Text('追加する'),
                      ),
                    ],
                  ),
                );
              },
            );
            if (result != null && result.isNotEmpty && context.mounted) {
              context.read<AppState>().addPhotoLog(result);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('フォトログを追加しました。')),
              );
            }
          },
          icon: const Icon(Icons.camera_alt_outlined),
          label: const Text('写真を追加（デモ用）'),
        ),
      ],
    );
  }
}

class _PhotoLogCard extends StatelessWidget {
  const _PhotoLogCard({required this.log});

  final PhotoLog log;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: AspectRatio(
              aspectRatio: 3 / 2,
              child: Image.network(
                log.imageUrl,
                fit: BoxFit.cover,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${log.capturedAt.month}/${log.capturedAt.day} ${_formatTime(log.capturedAt)}',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  log.note,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _LoadingDialog extends StatelessWidget {
  const _LoadingDialog({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 16),
            Flexible(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

