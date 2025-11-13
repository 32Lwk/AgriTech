-- CreateTable
CREATE TABLE "mile_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "opportunityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mile_transactions_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mile_transactions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "mile_transactions_farmerId_createdAt_idx" ON "mile_transactions"("farmerId", "createdAt");
