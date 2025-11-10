import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../data/models/studio_slot.dart';
import '../../state/app_state.dart';

class ReservationScreen extends StatefulWidget {
  const ReservationScreen({super.key});

  @override
  State<ReservationScreen> createState() => _ReservationScreenState();
}

class _ReservationScreenState extends State<ReservationScreen> {
  late DateTime _focusedDay;
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    _focusedDay = DateTime.now();
    _selectedDay = _focusedDay;
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final slots = state.studioSlots;
    final selectedDay = _selectedDay ?? _focusedDay;
    final daySlots = slots
        .where((slot) =>
            slot.date.year == selectedDay.year &&
            slot.date.month == selectedDay.month &&
            slot.date.day == selectedDay.day)
        .toList()
      ..sort((a, b) => a.timeLabel.compareTo(b.timeLabel));

    return Scaffold(
      appBar: AppBar(
        title: const Text('スタジオ予約'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: TableCalendar<StudioSlot>(
                focusedDay: _focusedDay,
                firstDay: DateTime.now().subtract(const Duration(days: 30)),
                lastDay: DateTime.now().add(const Duration(days: 90)),
                selectedDayPredicate: (day) =>
                    _selectedDay != null && isSameDay(_selectedDay, day),
                onDaySelected: (selected, focused) {
                  setState(() {
                    _selectedDay = selected;
                    _focusedDay = focused;
                  });
                },
                calendarFormat: CalendarFormat.twoWeeks,
                eventLoader: (day) {
                  return slots.where((slot) => isSameDay(slot.date, day)).toList();
                },
                calendarStyle: const CalendarStyle(
                  markerDecoration: BoxDecoration(
                    color: Colors.orangeAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                headerStyle: HeaderStyle(
                  titleCentered: true,
                  formatButtonVisible: false,
                  titleTextFormatter: (date, locale) =>
                      '${date.year}年${date.month}月',
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '${selectedDay.month}月${selectedDay.day}日の空き枠',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: daySlots.isEmpty
                ? Card(
                    key: const ValueKey('no-slots'),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'この日の空き枠はありません。他の日程をお試しください。',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  )
                : Column(
                    key: const ValueKey('has-slots'),
                    children: [
                      for (final slot in daySlots)
                        Card(
                          child: ListTile(
                            leading: Icon(
                              Icons.schedule,
                              color: slot.status == StudioSlotStatus.available
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(context).colorScheme.outline,
                            ),
                            title: Text(slot.timeLabel),
                            subtitle: Text(
                              slot.status == StudioSlotStatus.available ? '予約可能' : '予約済み',
                            ),
                            trailing: slot.status == StudioSlotStatus.available
                                ? FilledButton(
                                    onPressed: () => _reserveSlot(context, slot),
                                    child: const Text('予約する'),
                                  )
                                : const Icon(Icons.lock),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _reserveSlot(BuildContext context, StudioSlot slot) async {
    final navigator = Navigator.of(context);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _ReservationLoadingDialog(),
    );
    await Future<void>.delayed(const Duration(milliseconds: 400));
    context.read<AppState>().reserveSlot(slot.id);
    if (navigator.canPop()) {
      navigator.pop();
    }
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${slot.timeLabel}の予約が完了しました'),
        ),
      );
    }
  }
}

class _ReservationLoadingDialog extends StatelessWidget {
  const _ReservationLoadingDialog();

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
            Text(
              '予約を確定しています…',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

