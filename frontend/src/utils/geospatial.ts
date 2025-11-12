import { TOYOHASHI_BOUNDARY } from "@/data/toyohashiBoundary";

export type LatLng = {
  lat: number;
  lng: number;
};

type Point = [number, number]; // [lng, lat]

const BOUNDARY_POLYGONS: Point[][] = TOYOHASHI_BOUNDARY.map((polygon) =>
  polygon.map(([lng, lat]) => [lng, lat]),
);

const RAD = Math.PI / 180;

function toCartesian([lng, lat]: Point): [number, number] {
  const x = lng * Math.cos(lat * RAD);
  const y = lat;
  return [x, y];
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const [x, y] = toCartesian(point);
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = toCartesian(polygon[i]);
    const [xj, yj] = toCartesian(polygon[j]);

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function isInsideAny(point: Point, polygons: Point[][]): boolean {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

function projectedDistance(point: Point, a: Point, b: Point) {
  const [px, py] = toCartesian(point);
  const [ax, ay] = toCartesian(a);
  const [bx, by] = toCartesian(b);

  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;

  if (abLenSq === 0) {
    const dx = px - ax;
    const dy = py - ay;
    return { point: a, distanceSq: dx * dx + dy * dy };
  }

  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));

  const projX = ax + t * abx;
  const projY = ay + t * aby;
  const dx = px - projX;
  const dy = py - projY;

  const lat = projY;
  const lng = projX / Math.cos(lat * RAD);

  return {
    point: [lng, lat] as Point,
    distanceSq: dx * dx + dy * dy,
  };
}

function findNearestPoint(point: Point, polygons: Point[][]): Point {
  let best: { point: Point; distanceSq: number } | null = null;

  polygons.forEach((polygon) => {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const candidate = projectedDistance(point, a, b);

      if (best == null || candidate.distanceSq < best.distanceSq) {
        best = candidate;
      }
    }
  });

  return best?.point ?? point;
}

export function isInsideToyohashiBoundary({ lat, lng }: LatLng): boolean {
  return isInsideAny([lng, lat], BOUNDARY_POLYGONS);
}

export function clampToToyohashiBoundary({ lat, lng }: LatLng): LatLng {
  const point: Point = [lng, lat];
  if (isInsideAny(point, BOUNDARY_POLYGONS)) {
    return { lat, lng };
  }

  const nearest = findNearestPoint(point, BOUNDARY_POLYGONS);
  return {
    lat: Number(nearest[1].toFixed(6)),
    lng: Number(nearest[0].toFixed(6)),
  };
}

