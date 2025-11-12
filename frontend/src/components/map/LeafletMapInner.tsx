"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { Icon, type Map, type LatLngBounds } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  type MapContainerProps,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Box, Text } from "@chakra-ui/react";

const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const activeIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const colorIconMap: Record<string, Icon> = {
  default: defaultIcon,
  blue: new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  purple: new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  orange: new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  teal: new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

export type InnerMapMarker = {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  variant?: "default" | "blue" | "purple" | "orange" | "teal";
};

type LeafletMapInnerProps = {
  markers: InnerMapMarker[];
  center: [number, number];
  zoom: number;
  mapProps?: Partial<MapContainerProps>;
  height?: number | string;
  onMarkerClick?: (marker: InnerMapMarker) => void;
  selectedMarkerId?: string | null;
  showPopups?: boolean;
  onMapReady?: (map: Map) => void;
  invalidateSizeKey?: string | number;
  onBoundsChange?: (bounds: LatLngBounds) => void;
};

function ResizeHandler({
  invalidateSizeKey,
  markersLength,
}: {
  invalidateSizeKey?: string | number;
  markersLength: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map, markersLength, invalidateSizeKey]);

  return null;
}

function BoundsHandler({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: LatLngBounds) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onBoundsChange) return;
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend: () => {
      if (!onBoundsChange) return;
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      if (!onBoundsChange) return;
      onBoundsChange(map.getBounds());
    },
  });

  return null;
}

export default function LeafletMapInner({
  markers,
  center,
  zoom,
  mapProps,
  height = 360,
  onMarkerClick,
  selectedMarkerId,
  showPopups = true,
  onMapReady,
  invalidateSizeKey,
  onBoundsChange,
}: LeafletMapInnerProps) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      borderWidth="1px"
      style={{
        height: resolvedHeight,
        minHeight: resolvedHeight,
        width: "100%",
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{
          height: resolvedHeight,
          minHeight: resolvedHeight,
          width: "100%",
        }}
        whenCreated={(map) => {
          onMapReady?.(map);
        }}
        {...mapProps}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler
          invalidateSizeKey={invalidateSizeKey}
          markersLength={markers.length}
        />
        <BoundsHandler onBoundsChange={onBoundsChange} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={
              selectedMarkerId && marker.id === selectedMarkerId
                ? activeIcon
                : colorIconMap[marker.variant ?? "default"] ?? defaultIcon
            }
            eventHandlers={
              onMarkerClick
                ? {
                    click: () => {
                      onMarkerClick(marker);
                    },
                  }
                : undefined
            }
          >
            {showPopups ? (
              <Popup>
                <Text fontWeight="semibold">{marker.title}</Text>
                {marker.description ? (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    {marker.description}
                  </Text>
                ) : null}
              </Popup>
            ) : null}
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}

