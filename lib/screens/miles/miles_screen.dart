import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/mile_entry.dart';
import '../../state/app_state.dart';

class MilesScreen extends StatelessWidget {
  const MilesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final entries = [...state.mileHistory]..sort(
        (a, b) => a.recordedAt.compareTo(b.recordedAt),
      );
    final cumulative = _buildCumulativePoints(entries);

    return Scaffold(
      appBar: AppBar(
        title: const Text('マイルダッシュボード'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '現在の残高',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${state.currentMiles} pt',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 180,
                    child: LineChart(
                      LineChartData(
                        gridData: FlGridData(show: false),
                        titlesData: FlTitlesData(
                          leftTitles: const AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 40,
                            ),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final index = value.toInt();
                                if (index < 0 || index >= entries.length) {
                                  return const SizedBox();
                                }
                                final date = entries[index].recordedAt;
                                return Text('${date.month}/${date.day}');
                              },
                            ),
                          ),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            isCurved: true,
                            spots: cumulative,
                            color: Theme.of(context).colorScheme.primary,
                            barWidth: 3,
                            dotData: FlDotData(show: true),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '履歴',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          for (final entry in entries.reversed)
            Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: entry.type == MileEntryType.earn
                      ? Theme.of(context).colorScheme.primaryContainer
                      : Theme.of(context).colorScheme.secondaryContainer,
                  child: Icon(
                    entry.type == MileEntryType.earn ? Icons.add : Icons.remove,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
                title: Text(entry.title),
                subtitle: Text(_formatDate(entry.recordedAt)),
                trailing: Text(
                  entry.miles > 0 ? '+${entry.miles}' : entry.miles.toString(),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: entry.miles > 0
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.secondary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  List<FlSpot> _buildCumulativePoints(List<MileEntry> entries) {
    double sum = 0;
    final spots = <FlSpot>[];
    for (var i = 0; i < entries.length; i++) {
      sum += entries[i].miles.toDouble();
      spots.add(FlSpot(i.toDouble(), sum));
    }
    return spots.isEmpty ? [const FlSpot(0, 0)] : spots;
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.year}/${dateTime.month}/${dateTime.day}';
  }
}

