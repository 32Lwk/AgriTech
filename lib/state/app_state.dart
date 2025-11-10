import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/mock/mock_repository.dart';
import '../data/models/chat_message.dart';
import '../data/models/farm_opportunity.dart';
import '../data/models/mile_entry.dart';
import '../data/models/photo_log.dart';
import '../data/models/studio_slot.dart';

class AppState extends ChangeNotifier {
  AppState({MockRepository? repository})
      : _repository = repository ?? MockRepository();

  final MockRepository _repository;

  bool _initialized = false;
  bool get isInitialized => _initialized;

  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  List<FarmOpportunity> _farmPosts = const [];
  List<FarmOpportunity> get farmPosts => _farmPosts;

  List<MileEntry> _mileHistory = const [];
  List<MileEntry> get mileHistory => _mileHistory;

  List<StudioSlot> _studioSlots = const [];
  List<StudioSlot> get studioSlots => _studioSlots;

  List<ChatMessage> _chatThread = const [];
  List<ChatMessage> get chatThread => _chatThread;

  final Set<String> _appliedOpportunityIds = <String>{};
  final Set<String> _approvedOpportunityIds = <String>{};
  final Set<String> _checkedInOpportunityIds = <String>{};
  final Set<String> _completedOpportunityIds = <String>{};

  String _searchQuery = '';
  String? _selectedPrefecture;
  final Set<String> _selectedTags = <String>{};

  DateTime? _lastCheckInAt;
  DateTime? get lastCheckInAt => _lastCheckInAt;

  List<PhotoLog> _photoLogs = [
    PhotoLog(
      id: 'photo-initial-001',
      imageUrl:
          'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
      note: '前回の稲刈り風景。学生と農家が笑顔で写っています。',
      capturedAt: DateTime.now().subtract(const Duration(days: 7)),
    ),
  ];
  List<PhotoLog> get photoLogs => _photoLogs;

  final List<String> _samplePhotoPool = [
    'https://images.unsplash.com/photo-1598514982205-0844b66c5d05?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
  ];
  int _samplePhotoCursor = 0;

  String? _lastApprovedOpportunityId;
  String? get lastApprovedOpportunityId => _lastApprovedOpportunityId;

  List<FarmOpportunity> get filteredFarmPosts {
    return _farmPosts.where((post) {
      final matchesQuery = _searchQuery.isEmpty ||
          post.title.contains(_searchQuery) ||
          post.description.contains(_searchQuery) ||
          post.tags.any((tag) => tag.contains(_searchQuery));
      final matchesPrefecture =
          _selectedPrefecture == null || post.location.prefecture == _selectedPrefecture;
      final matchesTags = _selectedTags.isEmpty ||
          _selectedTags.every((tag) => post.tags.contains(tag));
      return matchesQuery && matchesPrefecture && matchesTags;
    }).toList();
  }

  String? get selectedPrefecture => _selectedPrefecture;
  Set<String> get selectedTags => Set.unmodifiable(_selectedTags);
  String get searchQuery => _searchQuery;

  List<String> get availablePrefectures =>
      _farmPosts.map((post) => post.location.prefecture).toSet().toList()..sort();

  Set<String> get availableTags =>
      Set.unmodifiable(_farmPosts.expand((post) => post.tags));

  int get currentMiles =>
      _mileHistory.fold<int>(0, (sum, entry) => sum + entry.miles);

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      final results = await Future.wait([
        _repository.fetchFarmPosts(),
        _repository.fetchMileHistory(),
        _repository.fetchStudioSlots(),
        _repository.fetchChatThread(),
      ]);
      _farmPosts = results[0] as List<FarmOpportunity>;
      _mileHistory = results[1] as List<MileEntry>;
      _studioSlots = results[2] as List<StudioSlot>;
      _chatThread = results[3] as List<ChatMessage>;
      _initialized = true;
      notifyListeners();
    } catch (error, stackTrace) {
      debugPrint('AppState initialize failed: $error\n$stackTrace');
      rethrow;
    }
  }

  Future<void> signInAnonymously() async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    _isAuthenticated = true;
    notifyListeners();
  }

  void signOut() {
    _isAuthenticated = false;
    notifyListeners();
  }

  void updateSearchQuery(String query) {
    _searchQuery = query.trim();
    notifyListeners();
  }

  void selectPrefecture(String? prefecture) {
    _selectedPrefecture = prefecture;
    notifyListeners();
  }

  void toggleTagFilter(String tag) {
    if (_selectedTags.contains(tag)) {
      _selectedTags.remove(tag);
    } else {
      _selectedTags.add(tag);
    }
    notifyListeners();
  }

  bool isApplied(String opportunityId) => _appliedOpportunityIds.contains(opportunityId);

  bool isApproved(String opportunityId) =>
      _approvedOpportunityIds.contains(opportunityId);

  bool isCheckedIn(String opportunityId) =>
      _checkedInOpportunityIds.contains(opportunityId);

  bool isCompleted(String opportunityId) =>
      _completedOpportunityIds.contains(opportunityId);

  Future<void> applyForOpportunity(FarmOpportunity opportunity) async {
    if (_appliedOpportunityIds.contains(opportunity.id)) {
      return;
    }
    _appliedOpportunityIds.add(opportunity.id);
    _appendStudentMessage('「${opportunity.title}」に応募しました。よろしくお願いします！');
    notifyListeners();

    Future<void>.delayed(const Duration(seconds: 1)).then((_) {
      if (!_appliedOpportunityIds.contains(opportunity.id) ||
          _approvedOpportunityIds.contains(opportunity.id)) {
        return;
      }
      _approvedOpportunityIds.add(opportunity.id);
      _appendOperatorMessage(
        '応募ありがとうございます！「${opportunity.title}」を承認しました。集合時間は開始30分前です。',
      );
      _lastApprovedOpportunityId = opportunity.id;
      notifyListeners();
    });
  }

  void sendStudentChat(String text) {
    if (text.trim().isEmpty) return;
    _appendStudentMessage(text.trim());
    notifyListeners();
  }

  Future<void> completeCheckIn(String opportunityId) async {
    if (!_appliedOpportunityIds.contains(opportunityId)) return;
    if (_checkedInOpportunityIds.contains(opportunityId)) return;
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _checkedInOpportunityIds.add(opportunityId);
    _lastCheckInAt = DateTime.now();
    _appendStudentMessage('現地に到着しチェックインしました。作業開始します！');
    notifyListeners();
  }

  Future<void> completeWork(String opportunityId) async {
    if (!_checkedInOpportunityIds.contains(opportunityId)) return;
    if (_completedOpportunityIds.contains(opportunityId)) return;
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final opportunity =
        _farmPosts.firstWhere((post) => post.id == opportunityId, orElse: () => throw StateError('Opportunity not found'));
    _completedOpportunityIds.add(opportunityId);
    final newEntry = MileEntry(
      id: 'mile-${DateTime.now().millisecondsSinceEpoch}',
      title: opportunity.title,
      type: MileEntryType.earn,
      miles: opportunity.rewardMiles,
      recordedAt: DateTime.now(),
    );
    _mileHistory = [..._mileHistory, newEntry];
    _appendOperatorMessage(
      'お疲れさまでした！「${opportunity.title}」の作業完了を確認し、${opportunity.rewardMiles}マイルを付与しました。',
    );
    notifyListeners();
  }

  void reserveSlot(String slotId) {
    final slotIndex = _studioSlots.indexWhere((slot) => slot.id == slotId);
    if (slotIndex == -1) return;
    final slot = _studioSlots[slotIndex];
    if (slot.status == StudioSlotStatus.reserved) return;
    final updatedSlot = StudioSlot(
      id: slot.id,
      date: slot.date,
      timeLabel: slot.timeLabel,
      status: StudioSlotStatus.reserved,
    );
    final updatedSlots = [..._studioSlots];
    updatedSlots[slotIndex] = updatedSlot;
    _studioSlots = updatedSlots;
    final newEntry = MileEntry(
      id: 'mile-spend-${DateTime.now().millisecondsSinceEpoch}',
      title: 'スタジオ予約 (${slot.timeLabel})',
      type: MileEntryType.spend,
      miles: -600,
      recordedAt: DateTime.now(),
    );
    _mileHistory = [..._mileHistory, newEntry];
    notifyListeners();
  }

  bool isSlotReserved(String slotId) {
    final slot = _studioSlots.firstWhere(
      (element) => element.id == slotId,
      orElse: () => throw StateError('Slot not found'),
    );
    return slot.status == StudioSlotStatus.reserved;
  }

  void _appendStudentMessage(String text) {
    final newMessage = ChatMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      sender: ChatSender.student,
      content: text,
      sentAt: DateTime.now(),
    );
    _chatThread = [..._chatThread, newMessage];
  }

  void _appendOperatorMessage(String text) {
    final newMessage = ChatMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      sender: ChatSender.operator,
      content: text,
      sentAt: DateTime.now(),
    );
    _chatThread = [..._chatThread, newMessage];
  }

  void addPhotoLog(String note) {
    final imageUrl = _samplePhotoPool[_samplePhotoCursor % _samplePhotoPool.length];
    _samplePhotoCursor += 1;
    final newLog = PhotoLog(
      id: 'photo-${DateTime.now().millisecondsSinceEpoch}',
      imageUrl: imageUrl,
      note: note,
      capturedAt: DateTime.now(),
    );
    _photoLogs = [..._photoLogs, newLog];
    notifyListeners();
  }

  void clearApprovalBanner() {
    _lastApprovedOpportunityId = null;
    notifyListeners();
  }
}

