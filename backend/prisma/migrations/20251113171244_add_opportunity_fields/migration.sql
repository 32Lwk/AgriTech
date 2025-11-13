/*
  Warnings:

  - Added the required column `rewardMiles` to the `opportunities` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "farmName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrls" TEXT,
    "memo" TEXT,
    "rewardMiles" INTEGER NOT NULL,
    "farmerId" TEXT NOT NULL,
    "farmlandId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "opportunities_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "opportunities_farmlandId_fkey" FOREIGN KEY ("farmlandId") REFERENCES "farmlands" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_opportunities" ("createdAt", "description", "endDate", "farmName", "farmerId", "farmlandId", "id", "startDate", "status", "title", "updatedAt", "rewardMiles") SELECT "createdAt", "description", "endDate", "farmName", "farmerId", "farmlandId", "id", "startDate", "status", "title", "updatedAt", 0 FROM "opportunities";
DROP TABLE "opportunities";
ALTER TABLE "new_opportunities" RENAME TO "opportunities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
