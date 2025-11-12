const fs = require("fs");
const path = require("path");

const { parsePolygonsFromGml } = require("./checkOpportunityLocations.js");

const GML_PATH = path.resolve(__dirname, "../../date/geojson/r2ka23201.gml");
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/data/toyohashiBoundary.ts",
);

function simplifyPolygon(polygon, step = 5) {
  if (polygon.length <= step) {
    return polygon;
  }
  const simplified = [];
  for (let i = 0; i < polygon.length; i += step) {
    simplified.push(polygon[i]);
  }
  const lastPoint = polygon[polygon.length - 1];
  const lastSimplified = simplified[simplified.length - 1];
  if (
    !lastSimplified ||
    lastSimplified[0] !== lastPoint[0] ||
    lastSimplified[1] !== lastPoint[1]
  ) {
    simplified.push(lastPoint);
  }
  return simplified;
}

function formatPolygons(polygons) {
  return polygons
    .map(
      (polygon) =>
        `[${polygon
          .map(
            ([lng, lat]) =>
              `[${Number(lng.toFixed(6))}, ${Number(lat.toFixed(6))}]`,
          )
          .join(", ")}]`,
    )
    .join(",\n  ");
}

function exportBoundary() {
  const gml = fs.readFileSync(GML_PATH, "utf-8");
  const polygons = parsePolygonsFromGml(gml);
  const simplified = polygons.map((polygon) => simplifyPolygon(polygon, 6));

  const content = `export const TOYOHASHI_BOUNDARY = [
  ${formatPolygons(simplified)}
] as const;

export type ToyohashiBoundary = typeof TOYOHASHI_BOUNDARY;
`;

  fs.writeFileSync(OUTPUT_PATH, content);
  console.log(
    `境界データを ${OUTPUT_PATH.replace(
      path.resolve(__dirname, ".."),
      ".",
    )} に書き出しました。`,
  );
}

if (require.main === module) {
  exportBoundary();
}

module.exports = { exportBoundary };

