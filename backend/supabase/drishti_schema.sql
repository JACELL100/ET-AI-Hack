-- DRISHTI Module — Supabase SQL Migration (public schema)
-- Run this ENTIRE script in your Supabase SQL Editor
-- https://supabase.com -> SQL Editor -> New Query

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create drishti_citizen_reports table in public schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drishti_citizen_reports (
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create drishti_incidents table in public schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drishti_incidents (
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.drishti_citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drishti_incidents ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS Policies (permissive — allow all reads and inserts for demo)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read access to drishti_citizen_reports" ON public.drishti_citizen_reports;
CREATE POLICY "Allow public read access to drishti_citizen_reports"
    ON public.drishti_citizen_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to drishti_citizen_reports" ON public.drishti_citizen_reports;
CREATE POLICY "Allow public insert to drishti_citizen_reports"
    ON public.drishti_citizen_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to drishti_incidents" ON public.drishti_incidents;
CREATE POLICY "Allow public read access to drishti_incidents"
    ON public.drishti_incidents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to drishti_incidents" ON public.drishti_incidents;
CREATE POLICY "Allow public insert to drishti_incidents"
    ON public.drishti_incidents FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Sample Citizen Reports (recent demo cases)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.drishti_citizen_reports
    (id, type, description, district, state, lat, lng, phone, reporter_name, timestamp, status)
VALUES
    ('CR-DEMO01', 'scam',
     'Digital arrest scam — CBI officer impersonation over WhatsApp video call, Rs 2.5L demanded immediately',
     'Mumbai Central', 'Maharashtra', 19.0760, 72.8777, '+919820011223', 'Rajesh Sharma',
     NOW() - INTERVAL '2 hours', 'received'),

    ('CR-DEMO02', 'upi',
     'QR code scam at local electronics shop. Transferred Rs 35,000 via fake GooglePay request on phone',
     'Bandra', 'Maharashtra', 19.1136, 72.8697, '+919876543210', 'Ananya Deshmukh',
     NOW() - INTERVAL '4 hours', 'received'),

    ('CR-DEMO03', 'counterfeit',
     'Fake Rs 500 note detected with serial prefix XY12. Three notes found at local petrol pump POS terminal.',
     'Noida', 'Uttar Pradesh', 28.5355, 77.3910, NULL, 'Suresh Kumar',
     NOW() - INTERVAL '6 hours', 'received'),

    ('CR-DEMO04', 'network',
     'Suspicious job portal scam demanding Rs 4,500 registration fee via UPI ID scammer@okicici. 12 victims reported.',
     'Bangalore Central', 'Karnataka', 12.9716, 77.5946, '+919123456789', 'Vikram Patel',
     NOW() - INTERVAL '12 hours', 'received'),

    ('CR-DEMO05', 'scam',
     'Fake electricity department officer called threatening power cut unless Rs 900 paid immediately on phone',
     'Hyderabad Central', 'Telangana', 17.3850, 78.4867, '+917788990011', 'Priya Reddy',
     NOW() - INTERVAL '18 hours', 'received'),

    ('CR-DEMO06', 'upi',
     'Received fake SBI alert SMS asking to update account via link. Clicked and Rs 15,000 was debited.',
     'Chennai Central', 'Tamil Nadu', 13.0827, 80.2707, '+919500001122', 'Mohan Krishnan',
     NOW() - INTERVAL '1 day', 'received'),

    ('CR-DEMO07', 'scam',
     'ED officer impersonation call claiming parcel contains illegal items, demanded Rs 3L to close the case',
     'New Delhi', 'Delhi', 28.6139, 77.2090, '+919988776655', 'Amit Kapoor',
     NOW() - INTERVAL '1 day 4 hours', 'received'),

    ('CR-DEMO08', 'counterfeit',
     'Bundle of 15 counterfeit Rs 200 notes with colour-shifting ink absent received from unknown vendor at market',
     'Kolkata Central', 'West Bengal', 22.5726, 88.3639, NULL, 'Debashis Ghosh',
     NOW() - INTERVAL '2 days', 'received')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Sample Incidents (Geospatial Heatmap Data)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.drishti_incidents
    (id, lat, lng, type, severity, timestamp, district, state, description, source_module)
VALUES
    ('I001', 18.9388, 72.8354, 'scam', 'critical',
     NOW() - INTERVAL '1 hour', 'Mumbai South', 'Maharashtra',
     'Digital arrest scam — CBI impersonation, Rs 3.2L demanded', 'SENTINEL'),

    ('I002', 19.0760, 72.8777, 'scam', 'critical',
     NOW() - INTERVAL '3 hours', 'Mumbai Central', 'Maharashtra',
     'Digital arrest — Customs officer deepfake video call', 'DRISHTI'),

    ('I003', 19.1136, 72.8697, 'upi', 'high',
     NOW() - INTERVAL '5 hours', 'Bandra', 'Maharashtra',
     'QR code payment scam, victim lost Rs 48,000', 'DRISHTI'),

    ('I004', 19.2183, 72.9781, 'counterfeit', 'high',
     NOW() - INTERVAL '7 hours', 'Navi Mumbai', 'Maharashtra',
     'Fake Rs 500 FICN detected at Vashi POS terminal', 'DRISHTI'),

    ('I005', 19.0330, 73.0297, 'network', 'medium',
     NOW() - INTERVAL '9 hours', 'Thane', 'Maharashtra',
     'Money mule activity — 12 linked accounts flagged by JAAL', 'JAAL'),

    ('I006', 28.6139, 77.2090, 'scam', 'critical',
     NOW() - INTERVAL '2 hours', 'New Delhi', 'Delhi',
     'ED officer impersonation — Rs 7.8L transferred to mule', 'SENTINEL'),

    ('I007', 28.7041, 77.1025, 'scam', 'critical',
     NOW() - INTERVAL '4 hours', 'Rohini', 'Delhi',
     'Digital arrest scam targeting retired government officer', 'DRISHTI'),

    ('I008', 28.5355, 77.3910, 'upi', 'high',
     NOW() - INTERVAL '6 hours', 'Noida', 'Uttar Pradesh',
     'Fake loan app fraud, 47 victims identified in cluster', 'JAAL'),

    ('I009', 28.4595, 77.0266, 'counterfeit', 'medium',
     NOW() - INTERVAL '10 hours', 'Gurugram', 'Haryana',
     'Counterfeit Rs 200 batch — 23 notes at petrol station', 'DRISHTI'),

    ('I010', 12.9716, 77.5946, 'scam', 'critical',
     NOW() - INTERVAL '8 hours', 'Bangalore Central', 'Karnataka',
     'Tech support scam impersonating Microsoft — Rs 1.1L lost', 'DRISHTI'),

    ('I011', 13.0359, 77.5970, 'upi', 'high',
     NOW() - INTERVAL '11 hours', 'Yelahanka', 'Karnataka',
     'Investment scam app — 89 victims across Bangalore North', 'JAAL'),

    ('I012', 12.9165, 77.6229, 'network', 'medium',
     NOW() - INTERVAL '14 hours', 'Koramangala', 'Karnataka',
     'JAAL: 3 fraud rings linked across MH-KA corridor', 'JAAL'),

    ('I013', 17.3850, 78.4867, 'scam', 'high',
     NOW() - INTERVAL '10 hours', 'Hyderabad Central', 'Telangana',
     'CBI arrest threat — victim transferred Rs 2.4L before alert', 'SENTINEL'),

    ('I014', 17.4065, 78.4772, 'counterfeit', 'high',
     NOW() - INTERVAL '13 hours', 'Secunderabad', 'Telangana',
     'High-quality FICN Rs 500 — 18 notes at Kacheguda railway', 'DRISHTI'),

    ('I015', 13.0827, 80.2707, 'scam', 'critical',
     NOW() - INTERVAL '5 hours', 'Chennai Central', 'Tamil Nadu',
     'Digital arrest — TRAI officer impersonation, Tamil language', 'SENTINEL'),

    ('I016', 22.5726, 88.3639, 'scam', 'high',
     NOW() - INTERVAL '9 hours', 'Kolkata Central', 'West Bengal',
     'NCB officer deepfake call — targeting WB senior citizens', 'DRISHTI'),

    ('I017', 23.0225, 72.5714, 'scam', 'high',
     NOW() - INTERVAL '7 hours', 'Ahmedabad West', 'Gujarat',
     'ED impersonation targeting textile merchants — 3 victims', 'SENTINEL'),

    ('I018', 18.5204, 73.8567, 'scam', 'high',
     NOW() - INTERVAL '6 hours', 'Pune City', 'Maharashtra',
     'CBI digital arrest — IT professional victim, Rs 5.6L', 'DRISHTI'),

    ('I019', 26.9124, 75.7873, 'scam', 'high',
     NOW() - INTERVAL '8 hours', 'Jaipur Central', 'Rajasthan',
     'Customs officer scam — gold import fraud threat', 'SENTINEL')
ON CONFLICT (id) DO NOTHING;
