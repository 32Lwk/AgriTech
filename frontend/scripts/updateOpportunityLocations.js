const fs = require("fs");
const path = require("path");

const {
  parsePolygonsFromGml,
  isInsideAny,
  parseOpportunities,
} = require("./checkOpportunityLocations.js");

const CITY_BOUNDARY_PATH = path.resolve(
  __dirname,
  "../../date/geojson/r2ka23201.gml",
);
const OPPORTUNITIES_PATH = path.resolve(
  __dirname,
  "../src/mock-data/opportunities.ts",
);

function normalizeName(value) {
  return value?.trim() ?? "";
}

function parseFarmlandFeatures(gml) {
  const features = [];
  const featureRegex = /<fme:(agri\d+)[^>]*>([\s\S]*?)<\/fme:\1>/g;
  let featureMatch;
  let index = 0;
  while ((featureMatch = featureRegex.exec(gml)) != null) {
    const body = featureMatch[2];
    const nameMatches = [
      ...body.matchAll(/<fme:AGRI_N>([^<]*)<\/fme:AGRI_N>/g),
      ...body.matchAll(/<fme:S_NAME>([^<]*)<\/fme:S_NAME>/g),
      ...body.matchAll(/<fme:KCITY_N>([^<]*)<\/fme:KCITY_N>/g),
    ];
    const names = Array.from(
      new Set(nameMatches.map((match) => normalizeName(match[1])).filter(Boolean)),
    );
    const posListMatch = /<gml:posList>([^<]+)<\/gml:posList>/.exec(body);
    if (!posListMatch) continue;

    const raw = posListMatch[1].trim().split(/\s+/).map(Number);
    const polygon = [];
    for (let i = 0; i < raw.length - 1; i += 2) {
      const lat = raw[i];
      const lng = raw[i + 1];
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        polygon.push([lng, lat]);
      }
    }
    if (polygon.length < 3) continue;

    const centroid = polygonCentroid(polygon);
    features.push({
      index: index++,
      names,
      polygon,
      centroid,
    });
  }
  return features;
}

function polygonCentroid(polygon) {
  const length = polygon.length;
  const lat0 =
    polygon.reduce((sum, [, lat]) => sum + lat, 0) / Math.max(length, 1);
  const lng0 =
    polygon.reduce((sum, [lng]) => sum + lng, 0) / Math.max(length, 1);
  const rad = Math.PI / 180;
  const coords = polygon.map(([lng, lat]) => {
    const x = (lng - lng0) * Math.cos(lat0 * rad);
    const y = lat - lat0;
    return { x, y };
  });

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < coords.length; i += 1) {
    const { x: x0, y: y0 } = coords[i];
    const { x: x1, y: y1 } = coords[(i + 1) % coords.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area /= 2;
  if (Math.abs(area) < 1e-9) {
    return [lng0, lat0];
  }

  cx /= 6 * area;
  cy /= 6 * area;
  const lng = cx / Math.cos(lat0 * rad) + lng0;
  const lat = cy + lat0;
  return [lng, lat];
}

function squaredDistance(pointA, pointB) {
  const rad = Math.PI / 180;
  const lat0 = (pointA[1] + pointB[1]) / 2;
  const xA = pointA[0] * Math.cos(lat0 * rad);
  const yA = pointA[1];
  const xB = pointB[0] * Math.cos(lat0 * rad);
  const yB = pointB[1];
  const dx = xA - xB;
  const dy = yA - yB;
  return dx * dx + dy * dy;
}

function findBestFarmland(address, originalPoint, features, usedIndexes) {
  const normalizedAddress = address.replace(/豊橋市/g, "").trim();
  const nameThreshold = 0.015 ** 2; // 約1.5km
  const fallbackThreshold = 0.03 ** 2; // 約3km
  const candidates = features.map((feature) => {
    let matchedName = "";
    for (const name of feature.names) {
      if (!name) continue;
      if (normalizedAddress.includes(name) && name.length > matchedName.length) {
        matchedName = name;
      }
    }
    const distance = squaredDistance(feature.centroid, originalPoint);
    const score = matchedName.length;
    return {
      feature,
      score,
      distance,
      reason: score > 0 ? `名称一致(${matchedName})` : "距離優先",
    };
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.distance - b.distance;
  });

  const pickCandidate = (predicate, reasonSuffix) => {
    for (const candidate of candidates) {
      if (predicate(candidate)) {
        const reason =
          reasonSuffix != null
            ? `${candidate.reason}${reasonSuffix}`
            : candidate.reason;
        return { ...candidate, reason };
      }
    }
    return null;
  };

  const bestByName = pickCandidate(
    (candidate) =>
      candidate.score > 0 &&
      candidate.distance <= nameThreshold &&
      !usedIndexes.has(candidate.feature.index),
  );
  if (bestByName) return bestByName;

  const bestNearby = pickCandidate(
    (candidate) =>
      candidate.distance <= fallbackThreshold &&
      !usedIndexes.has(candidate.feature.index),
  );
  if (bestNearby) return bestNearby;

  const unusedCandidate = pickCandidate(
    (candidate) => !usedIndexes.has(candidate.feature.index),
    "(未使用優先)",
  );
  if (unusedCandidate) return unusedCandidate;

  return { ...candidates[0], reason: `${candidates[0].reason}(再利用)` };
}

function updateOpportunities() {
  const boundaryGml = fs.readFileSync(CITY_BOUNDARY_PATH, "utf-8");
  const farmlandArg = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
  const farmlandPath = farmlandArg
    ? path.resolve(__dirname, farmlandArg)
    : path.resolve(
        __dirname,
        "../../date/geojson/agri201523201.gml",
      );
  const farmlandGml = fs.readFileSync(farmlandPath, "utf-8");
  const source = fs.readFileSync(OPPORTUNITIES_PATH, "utf-8");

  const boundaryPolygons = parsePolygonsFromGml(boundaryGml);
  const farmlandFeatures = parseFarmlandFeatures(farmlandGml);
  const opportunities = parseOpportunities(source);

  const updates = [];
  const usedIndexes = new Set();
  opportunities.forEach((item) => {
    const point = [item.lng, item.lat];
    if (isInsideAny(point, boundaryPolygons)) {
      return;
    }
    const match = findBestFarmland(
      item.address,
      point,
      farmlandFeatures,
      usedIndexes,
    );
    if (!match) {
      return;
    }
    usedIndexes.add(match.feature.index);
    updates.push({
      id: item.id,
      address: item.address,
      original: { lat: item.lat, lng: item.lng },
      suggested: {
        lat: Number(match.feature.centroid[1].toFixed(6)),
        lng: Number(match.feature.centroid[0].toFixed(6)),
      },
      reason: match.reason,
    });
  });

  if (updates.length === 0) {
    console.log("境界外の案件はありませんでした。");
    return;
  }

  let updatedSource = source;
  updates.forEach((update) => {
    const pattern = new RegExp(
      `(id:\\s*"${update.id}"[\\s\\S]+?lat:\\s*)(-?[0-9.]+)(,\\s*\\n\\s*lng:\\s*)(-?[0-9.]+)`,
      "m",
    );
    updatedSource = updatedSource.replace(
      pattern,
      `$1${update.suggested.lat}$3${update.suggested.lng}`,
    );
  });

  fs.writeFileSync(OPPORTUNITIES_PATH, updatedSource);
  console.log("以下の案件を更新しました:");
  updates.forEach((update) => {
    console.log(
      `${update.id} (${update.address}): ${update.original.lat}, ${update.original.lng} -> ${update.suggested.lat}, ${update.suggested.lng} [${update.reason}]`,
    );
  });
}

if (require.main === module) {
  updateOpportunities();
}

module.exports = {
  updateOpportunities,
  parseFarmlandFeatures,
  findBestFarmland,
};

