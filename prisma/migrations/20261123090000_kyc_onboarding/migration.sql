-- CreateTable
CREATE TABLE "OnboardingCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "applicationDate" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In progress',
    "riskRating" TEXT,
    "riskRationale" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OnboardingCase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdentityDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresOn" TEXT,
    "summary" TEXT NOT NULL,
    CONSTRAINT "IdentityDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "list" TEXT NOT NULL,
    "matchedName" TEXT NOT NULL,
    "matchStrength" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "disposition" TEXT NOT NULL DEFAULT 'Potential match',
    "dispositionReason" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ScreeningResult_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingCaseId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingEvent_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingCaseId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'fixture',
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "validation" TEXT NOT NULL DEFAULT 'passed',
    "output" TEXT NOT NULL,
    "rawResponse" TEXT,
    "inputSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingAnalysis_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingCase_clientId_key" ON "OnboardingCase"("clientId");

