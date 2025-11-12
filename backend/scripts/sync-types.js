#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.resolve(__dirname, "..", "src", "types");
const TARGET_DIR = path.resolve(__dirname, "..", "..", "frontend", "src", "shared-types", "backend");

const copyTypeFiles = () => {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`);
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  const entries = fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith(".ts"));
  entries.forEach((file) => {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(TARGET_DIR, file);
    const content = fs.readFileSync(srcPath, "utf8");
    const banner = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Copied from backend/src/types/${file} via backend/scripts/sync-types.js
`;
    fs.writeFileSync(destPath, `${banner}${content}`);
  });

  console.log(`Copied ${entries.length} type file(s) to ${TARGET_DIR}`);
};

try {
  copyTypeFiles();
} catch (error) {
  console.error("Failed to sync types:", error);
  process.exit(1);
}
