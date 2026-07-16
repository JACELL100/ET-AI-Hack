-- DRISHTI Module — Supabase SQL Migration
-- Run in Supabase SQL Editor (Settings > SQL Editor)

CREATE SCHEMA IF NOT EXISTS drishti;

-- Table for citizen reports
CREATE TABLE IF NOT EXISTS drishti.citizen_reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- scam, counterfeit, upi, network, other
    description TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone TEXT,
    reporter_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'received'
);

-- Table for incidents (heatmap points)
CREATE TABLE IF NOT EXISTS drishti.incidents (
    id TEXT PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL, -- scam, counterfeit, upi, network
    severity TEXT NOT NULL, -- critical, high, medium, low
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    description TEXT,
    source_module TEXT NOT NULL DEFAULT 'DRISHTI'
);

-- Enable RLS
ALTER TABLE drishti.citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE drishti.incidents ENABLE ROW LEVEL SECURITY;

-- Allow public access for local prototyping
CREATE POLICY "Allow public read access to citizen_reports" ON drishti.citizen_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert to citizen_reports" ON drishti.citizen_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to incidents" ON drishti.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public insert to incidents" ON drishti.incidents FOR INSERT WITH CHECK (true);
