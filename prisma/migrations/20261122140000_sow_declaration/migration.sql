-- Update only untouched synthetic wealth-gap profiles. Preserve edited profiles and all case history.
UPDATE "Client"
SET "profile" = 'Fictional private banking client; Singapore resident. Client declares SGD 8 million in wealth from a company sale.'
WHERE "id" IN ('CLI-002', 'CLI-006', 'CLI-010')
  AND "declaredWealth" = 800000000
  AND "profile" = 'Fictional private banking client; Singapore resident.';
