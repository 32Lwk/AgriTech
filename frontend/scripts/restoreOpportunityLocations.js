const fs = require("fs");
const path = require("path");

const OPPORTUNITIES_PATH = path.resolve(
  __dirname,
  "../src/mock-data/opportunities.ts",
);

const ORIGINAL_COORDS = {
  "op-007": { lat: 34.6621, lng: 137.3354 },
  "op-009": { lat: 34.6355, lng: 137.3468 },
  "op-012": { lat: 34.7198, lng: 137.2945 },
  "op-013": { lat: 34.8392, lng: 137.3283 },
  "op-014": { lat: 34.7986, lng: 137.3602 },
  "op-016": { lat: 34.7873, lng: 137.287 },
  "op-017": { lat: 34.6967, lng: 137.2723 },
  "op-019": { lat: 34.7159, lng: 137.3035 },
  "op-021": { lat: 34.8284, lng: 137.3469 },
  "op-023": { lat: 34.8211, lng: 137.3804 },
  "op-024": { lat: 34.8233, lng: 137.3317 },
  "op-025": { lat: 34.7981, lng: 137.3134 },
  "op-027": { lat: 34.8635, lng: 137.4335 },
  "op-028": { lat: 34.8488, lng: 137.3639 },
  "op-029": { lat: 34.8374, lng: 137.3728 },
  "op-031": { lat: 34.6268, lng: 137.3461 },
  "op-032": { lat: 34.6419, lng: 137.2942 },
  "op-039": { lat: 34.6314, lng: 137.3385 },
  "op-045": { lat: 34.6293, lng: 137.3325 },
  "op-049": { lat: 34.6327, lng: 137.3419 },
  "op-051": { lat: 34.8562, lng: 137.4175 },
};

function restore() {
  let source = fs.readFileSync(OPPORTUNITIES_PATH, "utf-8");
  Object.entries(ORIGINAL_COORDS).forEach(([id, { lat, lng }]) => {
    const pattern = new RegExp(
      `(id:\\s*"${id}"[\\s\\S]+?lat:\\s*)(-?[0-9.]+)(,\\s*\\n\\s*lng:\\s*)(-?[0-9.]+)`,
      "m",
    );
    source = source.replace(pattern, `$1${lat}$3${lng}`);
  });
  fs.writeFileSync(OPPORTUNITIES_PATH, source);
  console.log("元の座標にリセットしました。");
}

if (require.main === module) {
  restore();
}

module.exports = { restore };

