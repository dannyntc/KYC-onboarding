-- Each existing fictional client receives a stable account without changing case history.
CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  CONSTRAINT "Account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Account_clientId_key" ON "Account"("clientId");
INSERT INTO "Account" ("id", "clientId") SELECT 'ACC-' || "id", "id" FROM "Client";
ALTER TABLE "Transaction" ADD COLUMN "accountId" TEXT REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "Transaction" SET "accountId" = 'ACC-' || "clientId";
