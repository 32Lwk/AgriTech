const fs = require("fs");
const path = require("path");

const { parseFarmlandFeatures } = require("./updateOpportunityLocations.js");

const FARMLAND_PATH = path.resolve(
  __dirname,
  "../../date/geojson/agri201523201.gml",
);

const cliTargets = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const targets =
  cliTargets.length > 0
    ? cliTargets
    : [
        "西山",
        "西七根",
        "東七根",
        "市場",
        "東野",
        "新田",
        "雲谷",
        "伊古部",
        "前芝",
      ];

function main() {
  const gml = fs.readFileSync(FARMLAND_PATH, "utf-8");
  const features = parseFarmlandFeatures(gml);
  targets.forEach((name) => {
    const matched = features.filter((feature) => feature.names.includes(name));
    console.log(`${name}: ${matched.length} 件`);
    matched.slice(0, 5).forEach((feature, index) => {
      const [lng, lat] = feature.centroid;
      console.log(`  #${index + 1}: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}`);
    });
  });
}

if (require.main === module) {
  main();
}

