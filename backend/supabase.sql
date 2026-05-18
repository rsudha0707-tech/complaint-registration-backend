-- SQL commands to run in your Supabase SQL Editor

-- 1. Create the applications table with all requested fields
CREATE TABLE IF NOT EXISTS public.iovs_applications (
    id SERIAL PRIMARY KEY,
    application_id TEXT UNIQUE NOT NULL,
    service_type TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    aadhaar_number TEXT NOT NULL,
    address TEXT NOT NULL,
    ai_question TEXT,
    ai_answer TEXT,
    status TEXT DEFAULT 'Pending Verification',
    photo_path TEXT,
    signature_path TEXT,
    aadhaar_doc_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('iovs_documents', 'iovs_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Setup RLS (Row Level Security) - Allows anon inserts for the API
ALTER TABLE public.iovs_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to applications"
ON public.iovs_applications FOR INSERT
TO anon
WITH CHECK (true);

-- Storage Policy: Allow anon uploads to the documents bucket
CREATE POLICY "Allow anonymous document uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'iovs_documents');
