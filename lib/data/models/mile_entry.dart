import 'package:meta/meta.dart';

enum MileEntryType { earn, spend }

@immutable
class MileEntry {
  const MileEntry({
    required this.id,
    required this.title,
    required this.type,
    required this.miles,
    required this.recordedAt,
  });

  final String id;
  final String title;
  final MileEntryType type;
  final int miles;
  final DateTime recordedAt;

  factory MileEntry.fromJson(Map<String, dynamic> json) {
    return MileEntry(
      id: json['id'] as String,
      title: json['title'] as String,
      type: _parseType(json['type'] as String),
      miles: json['miles'] as int,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
    );
  }

  static MileEntryType _parseType(String raw) {
    switch (raw) {
      case 'earn':
        return MileEntryType.earn;
      case 'spend':
        return MileEntryType.spend;
      default:
        throw ArgumentError.value(raw, 'type', 'Unsupported mile entry type');
    }
  }
}

