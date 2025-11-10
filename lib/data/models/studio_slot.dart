import 'package:meta/meta.dart';

enum StudioSlotStatus { available, reserved }

@immutable
class StudioSlot {
  const StudioSlot({
    required this.id,
    required this.date,
    required this.timeLabel,
    required this.status,
  });

  final String id;
  final DateTime date;
  final String timeLabel;
  final StudioSlotStatus status;

  factory StudioSlot.fromJson(Map<String, dynamic> json) {
    return StudioSlot(
      id: json['id'] as String,
      date: DateTime.parse(json['date'] as String),
      timeLabel: json['timeLabel'] as String,
      status: _parseStatus(json['status'] as String),
    );
  }

  static StudioSlotStatus _parseStatus(String raw) {
    switch (raw) {
      case 'available':
        return StudioSlotStatus.available;
      case 'reserved':
        return StudioSlotStatus.reserved;
      default:
        throw ArgumentError.value(raw, 'status', 'Unsupported studio slot status');
    }
  }
}

