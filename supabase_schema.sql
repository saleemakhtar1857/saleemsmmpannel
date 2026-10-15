-- ==============================================================================
-- SALEEM SMM PANEL — SUPABASE POSTGRESQL SCHEMA
-- Run this entire script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. PROFILES TABLE (Stores user info, balances, and roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client', -- 'client' or 'admin'
  balance_pkr NUMERIC(12, 2) DEFAULT 0.00,
  balance_usd NUMERIC(12, 2) DEFAULT 0.00,
  spent_pkr NUMERIC(12, 2) DEFAULT 0.00,
  spent_usd NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DEPOSITS TABLE (EasyPaisa & UPaisa payment requests)
CREATE TABLE IF NOT EXISTS public.deposits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  username TEXT,
  user_email TEXT,
  method TEXT NOT NULL, -- 'EasyPaisa' or 'UPaisa'
  tid TEXT NOT NULL,
  amount_pkr NUMERIC(12, 2) NOT NULL,
  amount_usd NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ORDERS TABLE (SMM orders placed by users)
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  username TEXT,
  user_email TEXT,
  service_id INT NOT NULL,
  service_name TEXT NOT NULL,
  link TEXT NOT NULL,
  quantity INT NOT NULL,
  charge_pkr NUMERIC(12, 2) NOT NULL,
  charge_usd NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Processing', 'In progress', 'Completed', 'Canceled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CHATS TABLE (Live messages between Admin and Users)
CREATE TABLE IF NOT EXISTS public.chats (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- client username or email
  user_name TEXT,
  user_email TEXT,
  sender TEXT NOT NULL, -- 'user' or 'admin'
  sender_name TEXT,
  message TEXT NOT NULL,
  is_read_by_admin BOOLEAN DEFAULT false,
  is_read_by_user BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Allow public read/write with anon key for frictionless SMM client experience
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Deposits" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Public Insert Deposits" ON public.deposits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Deposits" ON public.deposits FOR UPDATE USING (true);

CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public Read Chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Public Insert Chats" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Chats" ON public.chats FOR UPDATE USING (true);

-- 6. REALTIME REPLICATION (For live chat & instant deposit notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 7. TRIGGER: AUTO-CREATE PROFILE ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name, phone, role, balance_pkr)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN lower(new.email) IN ('saleembaloch1857@gmail.com', 'yasinofficial03098158572@gmail.com') THEN 'admin'
      ELSE 'client'
    END,
    CASE 
      WHEN lower(new.email) IN ('saleembaloch1857@gmail.com', 'yasinofficial03098158572@gmail.com') THEN 25000.00
      ELSE 100.00 -- ₨ 100 Welcome Bonus
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    name = EXCLUDED.name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
