import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/chat_message.dart';
import '../models/farm_opportunity.dart';
import '../models/mile_entry.dart';
import '../models/studio_slot.dart';

class MockRepository {
  Future<List<FarmOpportunity>> fetchFarmPosts() async {
    final jsonList = await _loadJsonList('assets/mock/farm_posts.json');
    return jsonList
        .map((item) => FarmOpportunity.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<MileEntry>> fetchMileHistory() async {
    final jsonList = await _loadJsonList('assets/mock/mile_history.json');
    return jsonList
        .map((item) => MileEntry.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<StudioSlot>> fetchStudioSlots() async {
    final jsonList = await _loadJsonList('assets/mock/studio_slots.json');
    return jsonList
        .map((item) => StudioSlot.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChatMessage>> fetchChatThread() async {
    final jsonList = await _loadJsonList('assets/mock/chat_thread.json');
    return jsonList
        .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<dynamic>> _loadJsonList(String assetPath) async {
    final raw = await rootBundle.loadString(assetPath);
    final decoded = json.decode(raw);
    if (decoded is List<dynamic>) {
      return decoded;
    }
    throw StateError('Expected list JSON in $assetPath');
  }
}

