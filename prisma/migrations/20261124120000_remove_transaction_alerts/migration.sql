-- Transaction alerts, transaction history and accounts are removed: a bank onboarding a new client
-- has no transaction history or account for them yet. Dropping a table also drops its triggers.
DROP TABLE "Analysis";
DROP TABLE "AuditEvent";
DROP TABLE "Alert";
DROP TABLE "Transaction";
DROP TABLE "Account";
