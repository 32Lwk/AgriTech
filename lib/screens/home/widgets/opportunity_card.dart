import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/models/farm_opportunity.dart';
import '../../../state/app_state.dart';

class OpportunityCard extends StatelessWidget {
  const OpportunityCard({
    super.key,
    required this.opportunity,
    this.onTap,
  });

  final FarmOpportunity opportunity;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isApplied = state.isApplied(opportunity.id);
    final isApproved = state.isApproved(opportunity.id);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      opportunity.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _StatusChip(isApplied: isApplied, isApproved: isApproved),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${opportunity.location.prefecture}・${opportunity.location.city}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(
                    label: Text(
                      '期間: ${_formatDate(opportunity.workPeriod.startDate)}〜${_formatDate(opportunity.workPeriod.endDate)}',
                    ),
                  ),
                  Chip(label: Text('マイル ${opportunity.rewardMiles}pt')),
                  for (final tag in opportunity.tags.take(3)) Chip(label: Text(tag)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                opportunity.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.isApplied,
    required this.isApproved,
  });

  final bool isApplied;
  final bool isApproved;

  @override
  Widget build(BuildContext context) {
    if (!isApplied) {
      return Chip(
        label: const Text('募集中'),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      );
    }
    if (!isApproved) {
      return Chip(
        label: const Text('承認待ち'),
        backgroundColor: Theme.of(context).colorScheme.tertiaryContainer,
      );
    }
    return Chip(
      label: const Text('参加予定'),
      backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
    );
  }
}

