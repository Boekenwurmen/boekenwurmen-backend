-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Progression" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    "highestPage" INTEGER NOT NULL DEFAULT 0,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Progression" ("bookId", "clientId", "id", "pageId", "percentage", "updatedAt") SELECT "bookId", "clientId", "id", "pageId", "percentage", "updatedAt" FROM "Progression";
DROP TABLE "Progression";
ALTER TABLE "new_Progression" RENAME TO "Progression";
CREATE INDEX "Progression_clientId_idx" ON "Progression"("clientId");
CREATE INDEX "Progression_bookId_idx" ON "Progression"("bookId");
CREATE UNIQUE INDEX "Progression_clientId_bookId_key" ON "Progression"("clientId", "bookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
