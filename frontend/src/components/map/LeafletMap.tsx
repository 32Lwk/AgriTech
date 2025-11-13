"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { MapContainerProps } from "react-leaflet";
import { Center, Spinner, Text } from "@chakra-ui/react";
import type { Map, LatLngBounds } from "leaflet";

export type MapMarker = {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  variant?: "default" | "blue" | "purple" | "orange" | "teal";
};

type LeafletMapProps = {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  mapProps?: Partial<MapContainerProps>;
  height?: number | string;
  onMarkerClick?: (marker: MapMarker) => void;
  selectedMarkerId?: string | null;
  showPopups?: boolean;
  onMapReady?: (map: Map) => void;
  invalidateSizeKey?: string | number;
  onBoundsChange?: (bounds: LatLngBounds) => void;
  onMapClick?: (lat: number, lng: number) => void;
};

const DynamicMap = dynamic(
  async () => {
    try {
      const mod = await import("./LeafletMapInner");
      return mod.default;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("LeafletMapInner の読み込みに失敗しました", error);
      }
      // Provide a named React component for display name and lint compliance
      function MapLoadError() {
        return (
          <Center
            borderRadius="xl"
            borderWidth="1px"
            w="100%"
            h="100%"
            minH="240px"
            bg="red.50"
          >
            <Text fontSize="sm" color="red.600">
              マップの読み込みに失敗しました。コンソールを確認してください。
            </Text>
          </Center>
        );
      }
      MapLoadError.displayName = "MapLoadError";
      return MapLoadError;
    }
  },
  {
    ssr: false,
    loading: () => (
      <Center
        borderRadius="xl"
        borderWidth="1px"
        w="100%"
        h="100%"
        minH="240px"
        bg="gray.50"
      >
        <Spinner size="sm" mr={2} />
        <Text fontSize="sm" color="gray.500">
          マップを読み込んでいます…
        </Text>
      </Center>
    ),
  },
);

export default function LeafletMap({
  markers,
  center,
  zoom = 6,
  mapProps,
  height = 360,
  onMarkerClick,
  selectedMarkerId = null,
  showPopups,
  onMapReady,
  invalidateSizeKey,
  onBoundsChange,
  onMapClick,
}: LeafletMapProps) {
  const fallbackCenter = useMemo(() => {
    if (center) return center;
    if (markers.length > 0) {
      return markers[0].position;
    }
    return [35.6812, 139.7671] as [number, number]; // 東京駅
  }, [center, markers]);

  return (
    <DynamicMap
      markers={markers}
      center={fallbackCenter}
      zoom={zoom}
      mapProps={mapProps}
      height={height}
      onMarkerClick={onMarkerClick}
      selectedMarkerId={selectedMarkerId}
      showPopups={showPopups ?? !onMarkerClick}
      onMapReady={onMapReady}
      invalidateSizeKey={invalidateSizeKey}
      onBoundsChange={onBoundsChange}
      onMapClick={onMapClick}
    />
  );
}

