CREATE TRIGGER "audit_event_no_update" BEFORE UPDATE ON "AuditEvent"
BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END;
CREATE TRIGGER "audit_event_no_delete" BEFORE DELETE ON "AuditEvent"
BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END;
CREATE TRIGGER "audit_event_no_replace" BEFORE INSERT ON "AuditEvent"
WHEN EXISTS (SELECT 1 FROM "AuditEvent" WHERE "id" = NEW."id")
BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END;
