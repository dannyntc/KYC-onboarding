CREATE OR REPLACE FUNCTION onboarding_event_append_only_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Onboarding events are append-only';
END;
$$;

CREATE TRIGGER onboarding_event_no_update
BEFORE UPDATE ON "OnboardingEvent"
FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard();

CREATE TRIGGER onboarding_event_no_delete
BEFORE DELETE ON "OnboardingEvent"
FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard();
