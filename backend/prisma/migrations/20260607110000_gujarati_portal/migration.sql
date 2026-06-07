-- Gujarati Portal: meal timings, dharamshala details, derasar section
-- Run this SQL directly in Supabase SQL Editor, then run: npx prisma generate

ALTER TABLE "bhojanshalas"
  ADD COLUMN IF NOT EXISTS "navkarshiAvailable"     BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "navkarshiStartTime"     TEXT,
  ADD COLUMN IF NOT EXISTS "navkarshiEndTime"       TEXT,
  ADD COLUMN IF NOT EXISTS "navkarshiPrice"         INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lunchAvailable"         BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lunchStartTime"         TEXT,
  ADD COLUMN IF NOT EXISTS "lunchEndTime"           TEXT,
  ADD COLUMN IF NOT EXISTS "lunchPrice"             INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "choviharAvailable"      BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "choviharStartTime"      TEXT,
  ADD COLUMN IF NOT EXISTS "choviharEndTime"        TEXT,
  ADD COLUMN IF NOT EXISTS "choviharPrice"          INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dharamshalaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "dharamshalaLatitude"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dharamshalaLongitude"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dharamshalaPhotos"      TEXT[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "derasarAvailable"       BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "derasarDescription"     TEXT,
  ADD COLUMN IF NOT EXISTS "derasarLatitude"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "derasarLongitude"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "derasarPhotos"          TEXT[]       NOT NULL DEFAULT '{}';
