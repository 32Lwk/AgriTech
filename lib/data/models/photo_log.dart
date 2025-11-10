import 'package:meta/meta.dart';

@immutable
class PhotoLog {
  const PhotoLog({
    required this.id,
    required this.imageUrl,
    required this.note,
    required this.capturedAt,
  });

  final String id;
  final String imageUrl;
  final String note;
  final DateTime capturedAt;
}

