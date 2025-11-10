import 'package:meta/meta.dart';

enum ChatSender { student, operator }

@immutable
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.sender,
    required this.content,
    required this.sentAt,
  });

  final String id;
  final ChatSender sender;
  final String content;
  final DateTime sentAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      sender: _parseSender(json['sender'] as String),
      content: json['content'] as String,
      sentAt: DateTime.parse(json['sentAt'] as String),
    );
  }

  static ChatSender _parseSender(String raw) {
    switch (raw) {
      case 'student':
        return ChatSender.student;
      case 'operator':
        return ChatSender.operator;
      default:
        throw ArgumentError.value(raw, 'sender', 'Unsupported chat sender');
    }
  }
}

