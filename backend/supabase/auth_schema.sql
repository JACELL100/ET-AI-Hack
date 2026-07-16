-- ── RAKSHA AI: Separate Tables for Citizens & Admins ───────────────────────
-- Run this script in the Supabase SQL Editor (https://supabase.com -> SQL Editor)

-- Drop the old profiles table if it exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create citizens table
CREATE TABLE IF NOT EXISTS public.citizens (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for citizens
DROP POLICY IF EXISTS "Allow public read access to citizens" ON public.citizens;
CREATE POLICY "Allow public read access to citizens"
    ON public.citizens FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow users to update their own citizen profile" ON public.citizens;
CREATE POLICY "Allow users to update their own citizen profile"
    ON public.citizens FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own citizen profile" ON public.citizens;
CREATE POLICY "Allow users to insert their own citizen profile"
    ON public.citizens FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to upsert their own citizen profile" ON public.citizens;
CREATE POLICY "Allow users to upsert their own citizen profile"
    ON public.citizens FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for admins
DROP POLICY IF EXISTS "Allow public read access to admins" ON public.admins;
CREATE POLICY "Allow public read access to admins"
    ON public.admins FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow users to update their own admin profile" ON public.admins;
CREATE POLICY "Allow users to update their own admin profile"
    ON public.admins FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own admin profile" ON public.admins;
CREATE POLICY "Allow users to insert their own admin profile"
    ON public.admins FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to upsert their own admin profile" ON public.admins;
CREATE POLICY "Allow users to upsert their own admin profile"
    ON public.admins FOR INSERT
    WITH CHECK (auth.uid() = id);
