-- Enrich only unchanged synthetic extracts whose client and payment still match the seed.
UPDATE "KYCDocument"
SET "summary" = CASE "id"
  WHEN 'DOC-004' THEN 'Fictional signed agreement summary for property PROP-004: seller Marcus Lee; buyer Harbour Property Buyer; completion 2026-05-10; proceeds SGD 2,500,000. Settlement trail not supplied.'
  WHEN 'DOC-008' THEN 'Fictional signed agreement summary for property PROP-008: seller Julian Ong; buyer Harbour Property Buyer; completion 2026-05-10; proceeds SGD 2,500,000. Settlement trail not supplied.'
  WHEN 'DOC-012' THEN 'Fictional signed agreement summary for property PROP-012: seller Arun Nair; buyer Harbour Property Buyer; completion 2026-05-10; proceeds SGD 2,500,000. Settlement trail not supplied.'
END
WHERE "id" IN ('DOC-004','DOC-008','DOC-012')
  AND "kind" = 'property_sale'
  AND "title" = 'Property sale agreement'
  AND "summary" = 'Synthetic signed agreement records sale proceeds of SGD 2.5m.'
  AND "corroboratedAmount" = 250000000
  AND EXISTS (SELECT 1 FROM "Client" c WHERE c."id" = "KYCDocument"."clientId" AND (("KYCDocument"."id" = 'DOC-004' AND c."id" = 'CLI-004' AND c."name" = 'Marcus Lee') OR ("KYCDocument"."id" = 'DOC-008' AND c."id" = 'CLI-008' AND c."name" = 'Julian Ong') OR ("KYCDocument"."id" = 'DOC-012' AND c."id" = 'CLI-012' AND c."name" = 'Arun Nair')))
  AND EXISTS (SELECT 1 FROM "Transaction" t WHERE t."clientId" = "KYCDocument"."clientId" AND (("KYCDocument"."id" = 'DOC-004' AND t."id" = 'TXN-055') OR ("KYCDocument"."id" = 'DOC-008' AND t."id" = 'TXN-111') OR ("KYCDocument"."id" = 'DOC-012' AND t."id" = 'TXN-167')) AND t."date" = '2026-05-10' AND t."amount" = 250000000 AND t."currency" = 'SGD' AND t."counterparty" = 'Harbour Property Buyer');
