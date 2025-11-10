import 'package:meta/meta.dart';

@immutable
class FarmOpportunity {
  const FarmOpportunity({
    required this.id,
    required this.title,
    required this.farmerName,
    required this.location,
    required this.workPeriod,
    required this.rewardMiles,
    required this.tags,
    required this.description,
    required this.requiredStudents,
  });

  final String id;
  final String title;
  final String farmerName;
  final FarmLocation location;
  final WorkPeriod workPeriod;
  final int rewardMiles;
  final List<String> tags;
  final String description;
  final int requiredStudents;

  factory FarmOpportunity.fromJson(Map<String, dynamic> json) {
    return FarmOpportunity(
      id: json['id'] as String,
      title: json['title'] as String,
      farmerName: json['farmerName'] as String,
      location: FarmLocation.fromJson(json['location'] as Map<String, dynamic>),
      workPeriod: WorkPeriod.fromJson(json['workPeriod'] as Map<String, dynamic>),
      rewardMiles: json['rewardMiles'] as int,
      tags: (json['tags'] as List<dynamic>).cast<String>(),
      description: json['description'] as String,
      requiredStudents: json['requiredStudents'] as int,
    );
  }
}

@immutable
class FarmLocation {
  const FarmLocation({
    required this.prefecture,
    required this.city,
    required this.lat,
    required this.lng,
  });

  final String prefecture;
  final String city;
  final double lat;
  final double lng;

  factory FarmLocation.fromJson(Map<String, dynamic> json) {
    return FarmLocation(
      prefecture: json['prefecture'] as String,
      city: json['city'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }
}

@immutable
class WorkPeriod {
  const WorkPeriod({
    required this.startDate,
    required this.endDate,
  });

  final DateTime startDate;
  final DateTime endDate;

  factory WorkPeriod.fromJson(Map<String, dynamic> json) {
    return WorkPeriod(
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
    );
  }
}

