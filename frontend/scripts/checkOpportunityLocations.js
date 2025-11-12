const fs = require("fs");
const path = require("path");

const GML_PATH = path.resolve(__dirname, "../../date/geojson/r2ka23201.gml");
const OPPORTUNITIES_PATH = path.resolve(
  __dirname,
  "../src/mock-data/opportunities.ts",
);

function parsePolygonsFromGml(gml) {
  const polygons = [];
  const posListRegex = /<gml:posList>([^<]+)<\/gml:posList>/g;
  let match;
  while ((match = posListRegex.exec(gml)) != null) {
    const raw = match[1].trim().split(/\s+/).map(Number);
    const ring = [];
    for (let i = 0; i < raw.length - 1; i += 2) {
      const lat = raw[i];
      const lng = raw[i + 1];
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        ring.push([lng, lat]);
      }
    }
    if (ring.length > 2) {
      polygons.push(ring);
    }
  }
  return polygons;
}

function toCartesian([lng, lat]) {
  const rad = Math.PI / 180;
  const x = lng * Math.cos(lat * rad);
  const y = lat;
  return [x, y];
}

function pointInPolygon(point, polygon) {
  const [x, y] = toCartesian(point);
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
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

function isInsideAny(point, polygons) {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

function squaredDistance(a, b) {
  const [ax, ay] = toCartesian(a);
  const [bx, by] = toCartesian(b);
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function projectPointOnSegment(point, a, b) {
  const [px, py] = toCartesian(point);
  const [ax, ay] = toCartesian(a);
  const [bx, by] = toCartesian(b);

  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    return { point: a, distanceSq: squaredDistance(point, a) };
  }

  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const projX = ax + t * abx;
  const projY = ay + t * aby;

  const lng = projX / Math.cos(((ay + aby * t) * Math.PI) / 180);
  const lat = projY;

  const cartPoint = [projX, projY];
  const dx = cartPoint[0] - px;
  const dy = cartPoint[1] - py;
  return { point: [lng, lat], distanceSq: dx * dx + dy * dy };
}

function findNearestPointOnPolygons(point, polygons) {
  let best = { point, distanceSq: Number.POSITIVE_INFINITY };
  polygons.forEach((polygon) => {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const candidate = projectPointOnSegment(point, a, b);
      if (candidate.distanceSq < best.distanceSq) {
        best = candidate;
      }
    }
  });
  return best.point;
}

function parseOpportunities(text) {
  const entries = [];
  const regex =
    /id:\s*"(?<id>op-\d+)"[\s\S]+?location:\s*{[\s\S]+?address:\s*"(?<address>[^"]+)"[\s\S]+?lat:\s*(?<lat>-?[0-9.]+),[\s\S]+?lng:\s*(?<lng>-?[0-9.]+)/g;
  let match;
  while ((match = regex.exec(text)) != null) {
    const { id, address, lat, lng } = match.groups;
    entries.push({
      id,
      address,
      lat: Number(lat),
      lng: Number(lng),
    });
  }
  return entries;
}

function main() {
  const gml = fs.readFileSync(GML_PATH, "utf-8");
  const polygons = parsePolygonsFromGml(gml);

  if (polygons.length === 0) {
    throw new Error("境界ポリゴンが取得できませんでした。");
  }

  const ts = fs.readFileSync(OPPORTUNITIES_PATH, "utf-8");
  const opportunities = parseOpportunities(ts);

  const outside = [];
  opportunities.forEach((item) => {
    const point = [item.lng, item.lat];
    if (!isInsideAny(point, polygons)) {
      const nearest = findNearestPointOnPolygons(point, polygons);
      outside.push({
        ...item,
        suggestedLat: Number(nearest[1].toFixed(6)),
        suggestedLng: Number(nearest[0].toFixed(6)),
      });
    }
  });

  if (outside.length === 0) {
    console.log("全ての案件が豊橋市境界内に収まっています。");
    return;
  }

  console.log("境界外にある案件:");
  outside.forEach((item) => {
    console.log(
      `${item.id}: lat=${item.lat}, lng=${item.lng} -> lat=${item.suggestedLat}, lng=${item.suggestedLng}`,
    );
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  parsePolygonsFromGml,
  pointInPolygon,
  isInsideAny,
  findNearestPointOnPolygons,
  parseOpportunities,
};

