-- ================================================================
-- Jain Bhojanshala Finder — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------

-- Bhojanshalas (created first — profiles will FK to it)
CREATE TABLE IF NOT EXISTS public.bhojanshalas (
  id            TEXT PRIMARY KEY,
  name_gu       TEXT NOT NULL DEFAULT '',
  name_en       TEXT NOT NULL DEFAULT '',
  area_gu       TEXT DEFAULT '',
  area_en       TEXT DEFAULT '',
  city_gu       TEXT NOT NULL DEFAULT '',
  city_en       TEXT NOT NULL DEFAULT '',
  address_gu    TEXT DEFAULT '',
  address_en    TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  rating        NUMERIC(3,1) DEFAULT 4.5,
  reviews       INTEGER DEFAULT 0,
  dist          NUMERIC(5,1) DEFAULT 0,
  seed          INTEGER DEFAULT 1000,
  facilities    TEXT[] DEFAULT '{}',
  tiffin_available  BOOLEAN DEFAULT FALSE,
  tiffin_mode   TEXT CHECK (tiffin_mode IN ('own', 'provided', NULL)),
  tiffin_notes  TEXT DEFAULT '',
  notice_gu     TEXT DEFAULT '',
  notice_en     TEXT DEFAULT '',
  enabled       BOOLEAN DEFAULT TRUE,
  -- base meal times in minutes from midnight
  base_bs       INTEGER DEFAULT 420,   -- breakfast start  (7:00 AM)
  base_be       INTEGER DEFAULT 510,   -- breakfast end    (8:30 AM)
  base_bp       INTEGER DEFAULT 0,     -- breakfast price
  base_ls       INTEGER DEFAULT 660,   -- lunch start      (11:00 AM)
  base_le       INTEGER DEFAULT 810,   -- lunch end        (1:30 PM)
  base_lp       INTEGER DEFAULT 40,    -- lunch price
  base_ds       INTEGER DEFAULT 1080,  -- dinner start     (6:00 PM)
  base_de       INTEGER DEFAULT 1200,  -- dinner end       (8:00 PM)
  base_dp       INTEGER DEFAULT 40,    -- dinner price
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (one per auth user)
-- role: 'super_admin' has full access; 'admin' manages one bhojanshala
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  bhojanshala_id  TEXT REFERENCES public.bhojanshalas(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pending admins — super admin pre-registers an admin by email before they sign up
CREATE TABLE IF NOT EXISTS public.pending_admins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT DEFAULT '',
  bhojanshala_id  TEXT REFERENCES public.bhojanshalas(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Per-day closed status (7 rows per bhojanshala, day_of_week 0=Sun…6=Sat)
CREATE TABLE IF NOT EXISTS public.bhojanshala_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bhojanshala_id  TEXT NOT NULL REFERENCES public.bhojanshalas(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  closed          BOOLEAN DEFAULT FALSE,
  UNIQUE (bhojanshala_id, day_of_week)
);

-- Per-meal schedule (up to 21 rows per bhojanshala: 7 days × 3 meals)
CREATE TABLE IF NOT EXISTS public.bhojanshala_meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bhojanshala_id  TEXT NOT NULL REFERENCES public.bhojanshalas(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  available       BOOLEAN DEFAULT TRUE,
  time_start      INTEGER DEFAULT 0,   -- minutes from midnight
  time_end        INTEGER DEFAULT 0,
  price           INTEGER DEFAULT 0,
  items           TEXT[] DEFAULT '{}',
  UNIQUE (bhojanshala_id, day_of_week, meal_type)
);

-- Activity logs — every admin action is recorded
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bhojanshala_id  TEXT REFERENCES public.bhojanshalas(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_bhojanshala    ON public.profiles(bhojanshala_id);
CREATE INDEX IF NOT EXISTS idx_bhoj_city               ON public.bhojanshalas(city_en);
CREATE INDEX IF NOT EXISTS idx_bhoj_enabled            ON public.bhojanshalas(enabled);
CREATE INDEX IF NOT EXISTS idx_meals_bhoj              ON public.bhojanshala_meals(bhojanshala_id);
CREATE INDEX IF NOT EXISTS idx_days_bhoj               ON public.bhojanshala_days(bhojanshala_id);
CREATE INDEX IF NOT EXISTS idx_logs_created            ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_admin              ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_bhoj               ON public.activity_logs(bhojanshala_id);

-- ----------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------

-- Auto-update updated_at on bhojanshalas
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bhojanshalas_updated_at ON public.bhojanshalas;
CREATE TRIGGER bhojanshalas_updated_at
  BEFORE UPDATE ON public.bhojanshalas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- When a new auth user signs up, check pending_admins and auto-create their profile
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  pending RECORD;
BEGIN
  SELECT * INTO pending
  FROM public.pending_admins
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.profiles (id, name, phone, role, bhojanshala_id, status)
    VALUES (NEW.id, pending.name, pending.phone, 'admin', pending.bhojanshala_id, 'active')
    ON CONFLICT (id) DO NOTHING;

    DELETE FROM public.pending_admins WHERE LOWER(email) = LOWER(NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhojanshalas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhojanshala_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhojanshala_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_admins ENABLE ROW LEVEL SECURITY;

-- Helper: current user's role (STABLE so it can be used in RLS)
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: current user's bhojanshala_id
CREATE OR REPLACE FUNCTION public.my_bhojanshala()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT bhojanshala_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ---- profiles ----
CREATE POLICY "view_own_profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "super_admin_view_all_profiles"
  ON public.profiles FOR SELECT USING (public.my_role() = 'super_admin');

CREATE POLICY "super_admin_insert_profile"
  ON public.profiles FOR INSERT WITH CHECK (public.my_role() = 'super_admin');

CREATE POLICY "super_admin_update_profile"
  ON public.profiles FOR UPDATE USING (public.my_role() = 'super_admin');

CREATE POLICY "super_admin_delete_profile"
  ON public.profiles FOR DELETE USING (public.my_role() = 'super_admin');

-- Trigger (SECURITY DEFINER) needs INSERT access; allow system inserts
CREATE POLICY "system_insert_profile"
  ON public.profiles FOR INSERT WITH CHECK (TRUE);

-- ---- bhojanshalas ----
-- Public can read enabled bhojanshalas; authenticated users can read all
CREATE POLICY "public_view_enabled"
  ON public.bhojanshalas FOR SELECT
  USING (enabled = TRUE OR auth.role() = 'authenticated');

CREATE POLICY "super_admin_all_bhojanshalas"
  ON public.bhojanshalas FOR ALL
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');

-- Admin can only UPDATE their assigned bhojanshala (not insert/delete)
CREATE POLICY "admin_update_own_bhojanshala"
  ON public.bhojanshalas FOR UPDATE
  USING (id = public.my_bhojanshala() AND public.my_role() = 'admin');

-- ---- bhojanshala_days ----
CREATE POLICY "public_read_days"
  ON public.bhojanshala_days FOR SELECT USING (TRUE);

CREATE POLICY "super_admin_all_days"
  ON public.bhojanshala_days FOR ALL
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');

CREATE POLICY "admin_manage_own_days"
  ON public.bhojanshala_days FOR ALL
  USING (bhojanshala_id = public.my_bhojanshala() AND public.my_role() = 'admin')
  WITH CHECK (bhojanshala_id = public.my_bhojanshala() AND public.my_role() = 'admin');

-- ---- bhojanshala_meals ----
CREATE POLICY "public_read_meals"
  ON public.bhojanshala_meals FOR SELECT USING (TRUE);

CREATE POLICY "super_admin_all_meals"
  ON public.bhojanshala_meals FOR ALL
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');

CREATE POLICY "admin_manage_own_meals"
  ON public.bhojanshala_meals FOR ALL
  USING (bhojanshala_id = public.my_bhojanshala() AND public.my_role() = 'admin')
  WITH CHECK (bhojanshala_id = public.my_bhojanshala() AND public.my_role() = 'admin');

-- ---- activity_logs ----
CREATE POLICY "super_admin_view_all_logs"
  ON public.activity_logs FOR SELECT USING (public.my_role() = 'super_admin');

CREATE POLICY "admin_view_own_logs"
  ON public.activity_logs FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "authenticated_insert_log"
  ON public.activity_logs FOR INSERT WITH CHECK (admin_id = auth.uid());

-- ---- pending_admins ----
CREATE POLICY "super_admin_manage_pending"
  ON public.pending_admins FOR ALL
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');

-- ----------------------------------------------------------------
-- SEED: First Super Admin
-- After creating your account via the Supabase Auth dashboard,
-- run this with your actual UUID:
-- ----------------------------------------------------------------
-- INSERT INTO public.profiles (id, name, phone, role, status)
-- VALUES ('YOUR-UUID-HERE', 'Super Admin', '+91 XXXXX XXXXX', 'super_admin', 'active')
-- ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- SEED: Existing bhojanshalas from static data (optional)
-- ----------------------------------------------------------------
INSERT INTO public.bhojanshalas
  (id, name_gu, name_en, area_gu, area_en, city_gu, city_en, phone, rating, reviews, dist, seed, facilities, tiffin_available, tiffin_mode, enabled,
   base_bs, base_be, base_bp, base_ls, base_le, base_lp, base_ds, base_de, base_dp)
VALUES
  ('adinath',    'શ્રી આદિનાથ ભોજનશાળા',      'Shri Adinath Bhojanshala',      'તળેટી રોડ',        'Taleti Road',    'પાલીતાણા', 'Palitana',    '+91 98250 11221',  4.8, 312, 0.6, 7,  ARRAY['parking','water','washroom','dharamshala','temple','family'], true,  'own',      true,  420,510,50, 660,810,80, 1140,1260,70),
  ('mahavir',    'શ્રી મહાવીર ભોજનશાળા',       'Shri Mahavir Bhojanshala',      'પાલડી',            'Paldi',          'અમદાવાદ',  'Ahmedabad',   '+91 79 2657 8890', 4.6, 528, 2.4, 19, ARRAY['parking','water','washroom','wheelchair','family'],            true,  'provided', true,  450,540,40, 690,840,70, 1170,1290,65),
  ('shantinath', 'શાંતિનાથ ભોજનાલય',           'Shantinath Bhojanalay',         'દેરાસર માર્ગ',     'Derasar Marg',   'શંખેશ્વર', 'Shankheshwar','+91 98795 33442',  4.9, 196, 1.1, 31, ARRAY['parking','water','washroom','dharamshala','temple','family','wheelchair'], false, NULL, true, 420,495,0,  675,810,60, 1155,1275,55),
  ('parshwanath','શ્રી પાર્શ્વનાથ ભોજનશાળા',  'Shri Parshwanath Bhojanshala',  'ગોપીપુરા',         'Gopipura',       'સુરત',     'Surat',       '+91 261 242 7781', 4.5, 401, 3.8, 47, ARRAY['water','washroom','family'],                                   true,  'own',      true,  435,525,45, 660,810,75, 1185,1305,70),
  ('navkar',     'નવકાર ભોજનશાળા',             'Navkar Bhojanshala',            'ઘાટકોપર',          'Ghatkopar',      'મુંબઈ',    'Mumbai',      '+91 22 2510 9087', 4.7, 689, 5.2, 59, ARRAY['parking','water','washroom','wheelchair','temple','family'],   true,  'provided', true,  450,540,55, 705,855,90, 1200,1320,80),
  ('siddhgiri',  'શ્રી સિદ્ધગિરિ ભોજનશાળા',   'Shri Siddhgiri Bhojanshala',    'ગિરિરાજ સોસાયટી', 'Giriraj Society','પાલીતાણા', 'Palitana',    '+91 90999 21100',  4.4, 154, 0.9, 73, ARRAY['parking','water','washroom','dharamshala','family'],           false, NULL,       true,  420,510,40, 660,795,65, 1170,1290,60)
ON CONFLICT (id) DO NOTHING;
