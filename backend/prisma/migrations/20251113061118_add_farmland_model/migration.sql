-- CreateTable
CREATE TABLE "farmlands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "farmlands_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "farmName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "farmlandId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "opportunities_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "opportunities_farmlandId_fkey" FOREIGN KEY ("farmlandId") REFERENCES "farmlands" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_opportunities" ("createdAt", "description", "endDate", "farmName", "farmerId", "id", "startDate", "status", "title", "updatedAt") SELECT "createdAt", "description", "endDate", "farmName", "farmerId", "id", "startDate", "status", "title", "updatedAt" FROM "opportunities";
DROP TABLE "opportunities";
ALTER TABLE "new_opportunities" RENAME TO "opportunities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "farmlands_farmerId_idx" ON "farmlands"("farmerId");
