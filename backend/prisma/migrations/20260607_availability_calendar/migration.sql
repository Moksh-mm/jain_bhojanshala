-- Migration: Monthly Availability Calendar + Recurring Rules
-- Run this in Supabase SQL Editor

CREATE TABLE "availability_calendar" (
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

CREATE UNIQUE INDEX "availability_calendar_bhojanshalaId_date_key"
  ON "availability_calendar"("bhojanshalaId", "date");

CREATE INDEX "availability_calendar_bhojanshalaId_date_idx"
  ON "availability_calendar"("bhojanshalaId", "date");

ALTER TABLE "availability_calendar"
  ADD CONSTRAINT "availability_calendar_bhojanshalaId_fkey"
  FOREIGN KEY ("bhojanshalaId") REFERENCES "bhojanshalas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE "recurring_rules" (
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

CREATE UNIQUE INDEX "recurring_rules_bhojanshalaId_dayOfWeek_key"
  ON "recurring_rules"("bhojanshalaId", "dayOfWeek");

ALTER TABLE "recurring_rules"
  ADD CONSTRAINT "recurring_rules_bhojanshalaId_fkey"
  FOREIGN KEY ("bhojanshalaId") REFERENCES "bhojanshalas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Auto-update updatedAt trigger helper (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_availability_calendar_updated_at
  BEFORE UPDATE ON "availability_calendar"
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_recurring_rules_updated_at
  BEFORE UPDATE ON "recurring_rules"
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
