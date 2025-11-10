import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../data/models/farm_opportunity.dart';

class FarmMapPreview extends StatelessWidget {
  const FarmMapPreview({
    super.key,
    required this.opportunity,
  });

  final FarmOpportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final position = LatLng(
      opportunity.location.lat,
      opportunity.location.lng,
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 220,
        child: Stack(
          children: [
            GoogleMap(
              initialCameraPosition: CameraPosition(
                target: position,
                zoom: 12,
              ),
              markers: {
                Marker(
                  markerId: MarkerId(opportunity.id),
                  position: position,
                  infoWindow: InfoWindow(title: opportunity.title),
                ),
              },
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              liteModeEnabled: true,
            ),
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  opportunity.location.city,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

