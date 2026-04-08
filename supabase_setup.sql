-- ============================================================
-- BAUET Help Desk System — Database Setup
-- Run once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- User profiles (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  student_id  TEXT,
  role        TEXT NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'officer', 'authority', 'admin')),
  department  TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- Role upgrade requests (for officer / authority / admin registration)
-- Students register freely. Restricted roles submit a request here.
-- Admin reviews and approves from the admin panel.
CREATE TABLE IF NOT EXISTS public.role_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('officer', 'authority', 'admin')),
  status         TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  note           TEXT,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- Issue categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          SERIAL PRIMARY KEY,
  name_en     TEXT NOT NULL,
  name_bn     TEXT NOT NULL,
  icon        TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.categories (name_en, name_bn, icon) VALUES
  ('Academic',      'একাডেমিক',      '📚'),
  ('Hostel',        'হোস্টেল',        '🏠'),
  ('Registration',  'নিবন্ধন',        '📋'),
  ('Examination',   'পরীক্ষা',        '📝'),
  ('IT Support',    'আইটি সহায়তা',  '💻'),
  ('Medical',       'চিকিৎসা',        '🏥'),
  ('Others',        'অন্যান্য',        '📎')
ON CONFLICT DO NOTHING;


-- Support tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no     TEXT UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category_id   INT REFERENCES public.categories(id),
  status        TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority      TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  student_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  officer_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_no := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || LPAD(nextval('ticket_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_no
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  WHEN (NEW.ticket_no IS NULL)
  EXECUTE FUNCTION generate_ticket_no();


-- Replies on tickets
CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- Official notices and announcements
CREATE TABLE IF NOT EXISTS public.notices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en     TEXT NOT NULL,
  title_bn     TEXT,
  body_en      TEXT NOT NULL,
  body_bn      TEXT,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_pinned    BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id          SERIAL PRIMARY KEY,
  question_en TEXT NOT NULL,
  question_bn TEXT,
  answer_en   TEXT NOT NULL,
  answer_bn   TEXT,
  category    TEXT,
  order_index INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- Admin can update any profile (for role approval)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "role_requests_select_own"
  ON public.role_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can see all requests
CREATE POLICY "role_requests_select_admin"
  ON public.role_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own requests
CREATE POLICY "role_requests_insert"
  ON public.role_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update (approve/reject)
CREATE POLICY "role_requests_update_admin"
  ON public.role_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('officer', 'authority', 'admin')
    )
  );

CREATE POLICY "tickets_insert"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "tickets_update"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('officer', 'authority', 'admin')
    )
  );


ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replies_select"
  ON public.ticket_replies FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "replies_insert"
  ON public.ticket_replies FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());


ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select"
  ON public.notices FOR SELECT
  TO authenticated USING (is_active = TRUE);

CREATE POLICY "notices_manage"
  ON public.notices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('officer', 'admin')
    )
  );


ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  TO authenticated USING (TRUE);


ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select"
  ON public.faqs FOR SELECT
  TO authenticated USING (is_active = TRUE);

CREATE POLICY "faqs_manage"
  ON public.faqs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- TIMESTAMPS — keep updated_at current
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();



