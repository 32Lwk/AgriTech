-- Update farmlands table schema
-- Make address, prefecture, city optional
-- Make latitude, longitude required
-- Add imageUrls field

PRAGMA foreign_keys=OFF;

-- Create new farmlands table with updated schema
CREATE TABLE "new_farmlands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "prefecture" TEXT,
    "city" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "imageUrl" TEXT,
    "imageUrls" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_farmlands_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data
-- For existing records without latitude/longitude, set default values (Tokyo Station)
-- This is a temporary measure - in production, you should update these values manually
INSERT INTO "new_farmlands" (
    "id",
    "farmerId",
    "name",
    "address",
    "prefecture",
    "city",
    "latitude",
    "longitude",
    "imageUrl",
    "imageUrls",
    "description",
    "createdAt",
    "updatedAt"
)
SELECT 
    "id",
    "farmerId",
    "name",
    "address",
    "prefecture",
    "city",
    COALESCE("latitude", 35.6812) as "latitude",
    COALESCE("longitude", 139.7671) as "longitude",
    "imageUrl",
    NULL as "imageUrls",
    "description",
    "createdAt",
    "updatedAt"
FROM "farmlands";

-- Drop old table
DROP TABLE "farmlands";

-- Rename new table
ALTER TABLE "new_farmlands" RENAME TO "farmlands";

-- Recreate index
CREATE INDEX "farmlands_farmerId_idx" ON "farmlands"("farmerId");

PRAGMA foreign_keys=ON;

