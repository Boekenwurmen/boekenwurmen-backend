-- CreateTable
CREATE TABLE "Progression" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Progression_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Savepoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Savepoint_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Progression_clientId_idx" ON "Progression"("clientId");

-- CreateIndex
CREATE INDEX "Progression_bookId_idx" ON "Progression"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Progression_clientId_bookId_key" ON "Progression"("clientId", "bookId");

-- CreateIndex
CREATE INDEX "Savepoint_clientId_idx" ON "Savepoint"("clientId");

-- CreateIndex
CREATE INDEX "Savepoint_bookId_idx" ON "Savepoint"("bookId");
