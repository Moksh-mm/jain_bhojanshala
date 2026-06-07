-- Migration: Monthly Availability Calendar + Recurring Rules
-- Safe to re-run (idempotent) — uses IF NOT EXISTS throughout

CREATE TABLE IF NOT EXISTS "availability_calendar" (
  "id"               TEXT        NOT NULL,
  "bhojanshalaId"    TEXT        NOT NULL,
  "date"             DATE        NOT NULL,
  "isClosed"         BOOLEAN     NOT NULL DEFAULT false,
  "closedReason"     "ClosedReason",
  "closedNote"       TEXT,
  "specialNotice"    TEXT,
  "navkarshiEnabled" BOOLEAN     NOT NULL DEFAULT true,
  "navkarshiStart"   TEXT,
  "navkarshiEnd"     TEXT,
  "navkarshiPrice"   INTEGER,
  "lunchEnabled"     BOOLEAN     NOT NULL DEFAULT true,
  "lunchStart"       TEXT,
  "lunchEnd"         TEXT,
  "lunchPrice"       INTEGER,
  "choviharEnabled"  BOOLEAN     NOT NULL DEFAULT true,
  "choviharStart"    TEXT,
  "choviharEnd"      TEXT,
  "choviharPrice"    INTEGER,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "availability_calendar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "availability_calendar_bhojanshalaId_date_key"
  ON "availability_calendar"("bhojanshalaId", "date");

CREATE INDEX IF NOT EXISTS "availability_calendar_bhojanshalaId_date_idx"
  ON "availability_calendar"("bhojanshalaId", "date");

ALTER TABLE "availability_calendar"
  DROP CONSTRAINT IF EXISTS "availability_calendar_bhojanshalaId_fkey";

ALTER TABLE "availability_calendar"
  ADD CONSTRAINT "availability_calendar_bhojanshalaId_fkey"
  FOREIGN KEY ("bhojanshalaId") REFERENCES "bhojanshalas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "recurring_rules" (
  "id"               TEXT        NOT NULL,
  "bhojanshalaId"    TEXT        NOT NULL,
  "dayOfWeek"        INTEGER     NOT NULL,
  "isClosed"         BOOLEAN     NOT NULL DEFAULT false,
  "closedReason"     "ClosedReason",
  "navkarshiEnabled" BOOLEAN     NOT NULL DEFAULT true,
  "lunchEnabled"     BOOLEAN     NOT NULL DEFAULT true,
  "choviharEnabled"  BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recurring_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recurring_rules_bhojanshalaId_dayOfWeek_key"
  ON "recurring_rules"("bhojanshalaId", "dayOfWeek");

ALTER TABLE "recurring_rules"
  DROP CONSTRAINT IF EXISTS "recurring_rules_bhojanshalaId_fkey";

ALTER TABLE "recurring_rules"
  ADD CONSTRAINT "recurring_rules_bhojanshalaId_fkey"
  FOREIGN KEY ("bhojanshalaId") REFERENCES "bhojanshalas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Auto-update updatedAt trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_availability_calendar_updated_at ON "availability_calendar";
CREATE TRIGGER update_availability_calendar_updated_at
  BEFORE UPDATE ON "availability_calendar"
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_rules_updated_at ON "recurring_rules";
CREATE TRIGGER update_recurring_rules_updated_at
  BEFORE UPDATE ON "recurring_rules"
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
