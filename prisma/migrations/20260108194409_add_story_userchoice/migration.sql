-- CreateTable
CREATE TABLE "Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    "type" TEXT,
    "content" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserChoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "fromPageId" INTEGER NOT NULL,
    "toPageId" INTEGER NOT NULL,
    "optionName" TEXT,
    CONSTRAINT "UserChoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_bookId_pageId_key" ON "Story"("bookId", "pageId");

-- CreateIndex
CREATE INDEX "UserChoice_clientId_bookId_idx" ON "UserChoice"("clientId", "bookId");
