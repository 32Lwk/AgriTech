import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/farm_opportunity.dart';
import '../../state/app_state.dart';
import '../opportunity/opportunity_detail_screen.dart';
import 'widgets/opportunity_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final prefectures = state.availablePrefectures;
    final tags = state.availableTags.toList()..sort();
    final approvalId = state.lastApprovedOpportunityId;
    final approvedOpportunity = approvalId == null
        ? null
        : state.farmPosts.firstWhere(
            (post) => post.id == approvalId,
            orElse: () => state.farmPosts.first,
          );

    return Scaffold(
      appBar: AppBar(
        title: const Text('おすすめ募集'),
        actions: [
          IconButton(
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                showDragHandle: true,
                builder: (context) => _FilterBottomSheet(
                  prefectures: prefectures,
                  tags: tags,
                ),
              );
            },
            icon: const Icon(Icons.tune),
            tooltip: 'フィルタ',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'キーワードで検索（例：りんご、週末、東京都）',
                border: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
                filled: true,
              ),
              onChanged: (value) => context.read<AppState>().updateSearchQuery(value),
            ),
            const SizedBox(height: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 350),
              child: approvedOpportunity == null
                  ? const SizedBox.shrink()
                  : _ApprovalBanner(
                      opportunity: approvedOpportunity,
                      onDismiss: () => context.read<AppState>().clearApprovalBanner(),
                      onViewDetail: () => _openDetail(context, approvedOpportunity),
                    ),
            ),
            if (approvedOpportunity != null) const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final tag in tags.take(8))
                    FilterChip(
                      label: Text(tag),
                      selected: state.selectedTags.contains(tag),
                      onSelected: (_) => context.read<AppState>().toggleTagFilter(tag),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _buildList(context, state.filteredFarmPosts),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context, List<FarmOpportunity> posts) {
    if (posts.isEmpty) {
      return const _EmptyView();
    }
    return ListView.separated(
      itemCount: posts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final opportunity = posts[index];
        return OpportunityCard(
          opportunity: opportunity,
          onTap: () {
            _openDetail(context, opportunity);
          },
        );
      },
    );
  }

  void _openDetail(BuildContext context, FarmOpportunity opportunity) {
    Navigator.of(context).push(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 300),
        reverseTransitionDuration: const Duration(milliseconds: 250),
        pageBuilder: (context, animation, secondaryAnimation) =>
            FadeTransition(
          opacity: animation,
          child: OpportunityDetailScreen(opportunity: opportunity),
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final offsetAnimation = Tween<Offset>(
            begin: const Offset(0.05, 0.02),
            end: Offset.zero,
          ).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
          );
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: offsetAnimation,
              child: child,
            ),
          );
        },
      ),
    );
  }
}

class _FilterBottomSheet extends StatelessWidget {
  const _FilterBottomSheet({
    required this.prefectures,
    required this.tags,
  });

  final List<String> prefectures;
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'フィルタ',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Text(
            '都道府県',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ChoiceChip(
                label: const Text('すべて'),
                selected: state.selectedPrefecture == null,
                onSelected: (_) => context.read<AppState>().selectPrefecture(null),
              ),
              for (final prefecture in prefectures)
                ChoiceChip(
                  label: Text(prefecture),
                  selected: state.selectedPrefecture == prefecture,
                  onSelected: (_) => context.read<AppState>().selectPrefecture(prefecture),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '特徴タグ',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Expanded(
            child: SingleChildScrollView(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final tag in tags)
                    FilterChip(
                      label: Text(tag),
                      selected: state.selectedTags.contains(tag),
                      onSelected: (_) => context.read<AppState>().toggleTagFilter(tag),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.agriculture, size: 56),
          const SizedBox(height: 12),
          Text(
            '条件に一致する募集が見つかりませんでした。',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'フィルタを緩めるか、別のキーワードをお試しください。',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _ApprovalBanner extends StatelessWidget {
  const _ApprovalBanner({
    required this.opportunity,
    required this.onDismiss,
    required this.onViewDetail,
  });

  final FarmOpportunity opportunity;
  final VoidCallback onDismiss;
  final VoidCallback onViewDetail;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(opportunity.id),
      direction: DismissDirection.startToEnd,
      onDismissed: (_) => onDismiss(),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(Icons.notifications_active, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '承認されました！',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    '「${opportunity.title}」の参加が確定しました。',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: onViewDetail,
              child: const Text('詳細へ'),
            ),
          ],
        ),
      ),
    );
  }
}

