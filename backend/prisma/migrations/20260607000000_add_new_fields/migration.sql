-- Add ClosedReason enum
CREATE TYPE "ClosedReason" AS ENUM ('WEEKLY_HOLIDAY', 'FESTIVAL', 'MAINTENANCE', 'TEMPORARY', 'OTHER');

-- Add new columns to bhojanshalas
ALTER TABLE "bhojanshalas"
  ADD COLUMN IF NOT EXISTS "boilWater"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ekashnu"              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "biaasanu"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ambil"                BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tirth"                BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "upashray"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lift"                 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "airConditioned"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "contactPersonName"    TEXT,
  ADD COLUMN IF NOT EXISTS "alternateMobile"      TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappNumber"       TEXT,
  ADD COLUMN IF NOT EXISTS "email"                TEXT,
  ADD COLUMN IF NOT EXISTS "website"              TEXT,
  ADD COLUMN IF NOT EXISTS "state"                TEXT,
  ADD COLUMN IF NOT EXISTS "pinCode"              TEXT,
  ADD COLUMN IF NOT EXISTS "landmark"             TEXT,
  ADD COLUMN IF NOT EXISTS "entranceImage"        TEXT,
  ADD COLUMN IF NOT EXISTS "diningHallImage"      TEXT,
  ADD COLUMN IF NOT EXISTS "slug"                 TEXT,
  ADD COLUMN IF NOT EXISTS "metaTitle"            TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription"      TEXT,
  ADD COLUMN IF NOT EXISTS "openGraphImage"       TEXT;

-- Unique index on slug (allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS "bhojanshalas_slug_key" ON "bhojanshalas"("slug") WHERE "slug" IS NOT NULL;

-- Create closed_periods table
CREATE TABLE IF NOT EXISTS "closed_periods" (
    "id"            TEXT NOT NULL,
    "bhojanshalaId" TEXT NOT NULL,
    "reason"        "ClosedReason" NOT NULL DEFAULT 'OTHER',
    "note"          TEXT,
    "startDate"     DATE NOT NULL,
    "endDate"       DATE NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closed_periods_pkey" PRIMARY KEY ("id")
);

-- Index on closed_periods
CREATE INDEX IF NOT EXISTS "closed_periods_bhojanshalaId_idx" ON "closed_periods"("bhojanshalaId");

-- Foreign key for closed_periods
ALTER TABLE "closed_periods"
  ADD CONSTRAINT "closed_periods_bhojanshalaId_fkey"
  FOREIGN KEY ("bhojanshalaId") REFERENCES "bhojanshalas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
