CREATE OR REPLACE FUNCTION audit_event_append_only_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END;
$$;

CREATE TRIGGER audit_event_no_update
BEFORE UPDATE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION audit_event_append_only_guard();

CREATE TRIGGER audit_event_no_delete
BEFORE DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION audit_event_append_only_guard();
