-- Migration: Add Ayambil Shala support
-- Safe to re-run (idempotent) — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- ── bhojanshalas ─────────────────────────────────────────────────
ALTER TABLE "bhojanshalas"
  ADD COLUMN IF NOT EXISTS "ayambilShalaEnabled"       BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ayambilStartTime"           TEXT,
  ADD COLUMN IF NOT EXISTS "ayambilEndTime"             TEXT,
  ADD COLUMN IF NOT EXISTS "ayambilPrice"               INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ayambilLocationSameAsBhoj"  BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "ayambilLatitude"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "ayambilLongitude"           DOUBLE PRECISION;

-- ── availability_calendar ─────────────────────────────────────────
ALTER TABLE "availability_calendar"
  ADD COLUMN IF NOT EXISTS "ayambilEnabled" BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "ayambilStart"   TEXT,
  ADD COLUMN IF NOT EXISTS "ayambilEnd"     TEXT,
  ADD COLUMN IF NOT EXISTS "ayambilPrice"   INTEGER;

-- ── recurring_rules ───────────────────────────────────────────────
ALTER TABLE "recurring_rules"
  ADD COLUMN IF NOT EXISTS "ayambilEnabled" BOOLEAN  NOT NULL DEFAULT true;
