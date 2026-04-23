-- ============================================================================
-- UrbanFix — Supabase Schema Fixes
-- Run this in the Supabase SQL Editor to fix missing buckets and policies
-- ============================================================================

-- 1. Create missing storage buckets used by the application
-- The app uses 'reports' (for citizens) and 'report-photos' (for technicians)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('reports', 'reports', true),
  ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing restrictive policies that only allowed the 'reports' bucket
DROP POLICY IF EXISTS "reports_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "reports_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "reports_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "reports_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated viewing" ON storage.objects;

-- 3. Create comprehensive policies that allow both 'reports' and 'report-photos'
-- Allow authenticated users to upload photos to either bucket
CREATE POLICY "reports_bucket_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('reports', 'report-photos') AND auth.uid() IS NOT NULL);

-- Allow authenticated users to view photos from either bucket
CREATE POLICY "reports_bucket_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('reports', 'report-photos'));

-- Allow users to update their own photos
CREATE POLICY "reports_bucket_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('reports', 'report-photos') AND owner = auth.uid());

-- Allow users to delete their own photos
CREATE POLICY "reports_bucket_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('reports', 'report-photos') AND owner = auth.uid());

-- 4. Ensure Realtime is enabled for reports and notifications
-- (Sometimes this fails if already enabled, so we catch the exception)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;
