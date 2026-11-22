CREATE TRIGGER "onboarding_event_no_update" BEFORE UPDATE ON "OnboardingEvent"
BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END;
CREATE TRIGGER "onboarding_event_no_delete" BEFORE DELETE ON "OnboardingEvent"
BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END;
CREATE TRIGGER "onboarding_event_no_replace" BEFORE INSERT ON "OnboardingEvent"
WHEN EXISTS (SELECT 1 FROM "OnboardingEvent" WHERE "id" = NEW."id")
BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END;
