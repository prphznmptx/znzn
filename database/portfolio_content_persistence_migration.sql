-- =============================================
-- PORTFOLIO CONTENT PERSISTENCE MIGRATION
-- Add deletion tracking and publication management to portfolio_page_content
-- =============================================

-- 1. Add missing columns to portfolio_page_content table for tracking publication and deletion
ALTER TABLE public.portfolio_page_content
ADD COLUMN IF NOT EXISTS publication_destination TEXT DEFAULT 'portfolio' CHECK (publication_destination IN ('portfolio', 'media', 'masterclass')),
ADD COLUMN IF NOT EXISTS published_to JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted_pending BOOLEAN DEFAULT FALSE;

-- 2. Update status constraint to include all possible statuses
ALTER TABLE public.portfolio_page_content
DROP CONSTRAINT IF EXISTS portfolio_page_content_status_check;

ALTER TABLE public.portfolio_page_content
ADD CONSTRAINT portfolio_page_content_status_check 
CHECK (status IN ('draft', 'published', 'archived', 'pending_deletion', 'permanently_deleted'));

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_page_content_user_id_status ON public.portfolio_page_content(user_id, status);
CREATE INDEX IF NOT EXISTS idx_portfolio_page_content_auto_delete_at ON public.portfolio_page_content(auto_delete_at)
WHERE auto_delete_at IS NOT NULL;

-- 4. Create function to handle deletion tracking
CREATE OR REPLACE FUNCTION public.on_portfolio_content_deleted_from_all_places()
RETURNS TRIGGER AS $$
BEGIN
  -- When marking as pending deletion, set deletion timestamps
  IF NEW.status = 'pending_deletion' AND OLD.status != 'pending_deletion' THEN
    NEW.deleted_at = NOW();
    NEW.auto_delete_at = NOW() + INTERVAL '3 days';
    NEW.is_deleted_pending = TRUE;
  END IF;
  
  -- When saving content that was pending deletion, reset deletion timestamps
  IF NEW.saved = TRUE AND OLD.saved = FALSE THEN
    NEW.deleted_at = NULL;
    NEW.auto_delete_at = NULL;
    NEW.is_deleted_pending = FALSE;
    NEW.status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for portfolio content deletion tracking
DROP TRIGGER IF EXISTS trigger_portfolio_content_deleted_from_all_places ON public.portfolio_page_content;

CREATE TRIGGER trigger_portfolio_content_deleted_from_all_places
BEFORE UPDATE ON public.portfolio_page_content
FOR EACH ROW
EXECUTE FUNCTION public.on_portfolio_content_deleted_from_all_places();

-- 6. Create cleanup function for expired deleted portfolio content
CREATE OR REPLACE FUNCTION public.cleanup_expired_deleted_portfolio_content()
RETURNS void AS $$
BEGIN
  UPDATE public.portfolio_page_content
  SET status = 'permanently_deleted'
  WHERE 
    auto_delete_at IS NOT NULL 
    AND auto_delete_at < NOW() 
    AND saved = FALSE
    AND status = 'pending_deletion';
END;
$$ LANGUAGE plpgsql;

-- 7. Ensure update_updated_at_column function exists (should already exist from media setup)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for portfolio_page_content updated_at
DROP TRIGGER IF EXISTS trigger_update_portfolio_page_content_updated_at ON public.portfolio_page_content;

CREATE TRIGGER trigger_update_portfolio_page_content_updated_at
BEFORE UPDATE ON public.portfolio_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update RLS policies for portfolio_page_content
ALTER TABLE public.portfolio_page_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all portfolio_page_content" ON public.portfolio_page_content;
DROP POLICY IF EXISTS "Users can insert their own portfolio_page_content" ON public.portfolio_page_content;
DROP POLICY IF EXISTS "Users can update their own portfolio_page_content" ON public.portfolio_page_content;
DROP POLICY IF EXISTS "Users can delete their own portfolio_page_content" ON public.portfolio_page_content;
DROP POLICY IF EXISTS "Public users can view published portfolio_page_content" ON public.portfolio_page_content;

-- Create new policies
CREATE POLICY "Authenticated users can view all portfolio_page_content" ON public.portfolio_page_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public users can view published portfolio_page_content" ON public.portfolio_page_content
  FOR SELECT TO anon USING (status = 'published');

CREATE POLICY "Users can insert their own portfolio_page_content" ON public.portfolio_page_content
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio_page_content" ON public.portfolio_page_content
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio_page_content" ON public.portfolio_page_content
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. Update storage bucket policies for portfolio_page_content
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio_page_content', 'portfolio_page_content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio bucket
DROP POLICY IF EXISTS "Enable upload for portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read for portfolio" ON storage.objects;

CREATE POLICY "Enable upload for portfolio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio_page_content');

CREATE POLICY "Enable delete for portfolio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio_page_content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable public read for portfolio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio_page_content');

-- 11. Set up pg_cron for auto-cleanup of expired portfolio content (if not already scheduled)
-- Note: This requires pg_cron extension to be enabled in Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup every hour
SELECT cron.schedule('cleanup-expired-portfolio-content', '0 * * * *', 'SELECT public.cleanup_expired_deleted_portfolio_content()');

-- 12. Data migration: Set default values for existing portfolio content
UPDATE public.portfolio_page_content
SET 
  publication_destination = COALESCE(publication_destination, 'portfolio'),
  published_to = COALESCE(published_to, '["portfolio"]'::jsonb),
  saved = COALESCE(saved, FALSE),
  is_deleted_pending = COALESCE(is_deleted_pending, FALSE)
WHERE publication_destination IS NULL OR published_to IS NULL;
