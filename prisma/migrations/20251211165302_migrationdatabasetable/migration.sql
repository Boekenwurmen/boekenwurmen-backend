/*
  Warnings:

  - You are about to drop the column `email` on the `Client` table. All the data in the column will be lost.
  - Made the column `name` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "code" TEXT
);
INSERT INTO "new_Client" ("code", "createdAt", "id", "name") SELECT "code", "createdAt", "id", "name" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
