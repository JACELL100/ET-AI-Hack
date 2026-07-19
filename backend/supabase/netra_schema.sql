-- NETRA Module — Supabase SQL Migration (public schema)
-- Run this ENTIRE script in your Supabase SQL Editor:
-- https://supabase.com -> SQL Editor -> New Query -> Run

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create netra_scans table in public schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.netra_scans (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  image_url TEXT,
  denomination TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('AUTHENTIC', 'SUSPICIOUS', 'COUNTERFEIT')),
  confidence REAL NOT NULL,
  overall_score REAL,
  serial_number TEXT,
  latitude REAL,
  longitude REAL,
  scan_source TEXT DEFAULT 'web_upload',
  pipeline_version TEXT DEFAULT 'NETRA-v5.0-MultiModal',
  processing_time_ms INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_netra_scans_created_at ON public.netra_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_netra_scans_verdict ON public.netra_scans(verdict);

-- Enable Row Level Security (RLS)
ALTER TABLE public.netra_scans ENABLE ROW LEVEL SECURITY;

-- Permissive policy for demo (allows reads & inserts)
DROP POLICY IF EXISTS "Allow all public netra_scans" ON public.netra_scans;
CREATE POLICY "Allow all public netra_scans"
  ON public.netra_scans FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Optional: netra schema for isolated deployments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS netra;

CREATE TABLE IF NOT EXISTS netra.scans (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  image_url TEXT,
  denomination TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('AUTHENTIC', 'SUSPICIOUS', 'COUNTERFEIT')),
  confidence REAL NOT NULL,
  overall_score REAL,
  serial_number TEXT,
  latitude REAL,
  longitude REAL,
  scan_source TEXT DEFAULT 'web_upload',
  pipeline_version TEXT DEFAULT 'NETRA-v5.0-MultiModal',
  processing_time_ms INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE netra.scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all netra scans" ON netra.scans;
CREATE POLICY "Allow all netra scans" ON netra.scans FOR ALL USING (true) WITH CHECK (true);
