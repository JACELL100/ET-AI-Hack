-- NETRA Module — Supabase SQL Migration
-- Run in Supabase SQL Editor (Settings > SQL Editor)

CREATE SCHEMA IF NOT EXISTS netra;

CREATE TABLE IF NOT EXISTS netra.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  pipeline_version TEXT DEFAULT 'NETRA-v2.0-YOLOv12',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netra.feature_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES netra.scans(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  detected BOOLEAN DEFAULT FALSE,
  quality_score REAL,
  status TEXT CHECK (status IN ('pass', 'fail', 'warn')),
  bounding_box JSONB,
  notes TEXT,
  confidence REAL
);

CREATE TABLE IF NOT EXISTS netra.serial_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES netra.scans(id) ON DELETE CASCADE,
  extracted_number TEXT,
  format_valid BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  known_pattern TEXT,
  previous_detection_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netra.counterfeit_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_prefix TEXT,
  denomination TEXT,
  description TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  detection_count INTEGER DEFAULT 1,
  geographic_spread JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_netra_scans_created_at ON netra.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_netra_scans_verdict ON netra.scans(verdict);
CREATE INDEX IF NOT EXISTS idx_netra_feature_results_scan_id ON netra.feature_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_netra_serial_numbers_extracted ON netra.serial_numbers(extracted_number);

-- RLS
ALTER TABLE netra.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE netra.feature_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE netra.serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE netra.counterfeit_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all netra scans" ON netra.scans FOR ALL USING (true);
CREATE POLICY "Allow all feature results" ON netra.feature_results FOR ALL USING (true);
CREATE POLICY "Allow all serial numbers" ON netra.serial_numbers FOR ALL USING (true);
CREATE POLICY "Allow all counterfeit patterns" ON netra.counterfeit_patterns FOR ALL USING (true);

-- Seed known counterfeit patterns
INSERT INTO netra.counterfeit_patterns (serial_prefix, denomination, description, detection_count)
VALUES
  ('XY12', '₹500', 'FICN batch — poor microprint, security thread gap', 15),
  ('AB78', '₹500', 'High-quality offset print, missing embedded security thread', 8),
  ('MN34', '₹200', 'Colour-shifting ink absent, wrong denomination numeral font', 3),
  ('PQ56', '₹100', 'Watermark position offset by 2mm, bleed lines absent', 22)
ON CONFLICT DO NOTHING;
