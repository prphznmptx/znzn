-- Create video_uploads table for tracking Mux video processing
CREATE TABLE IF NOT EXISTS public.video_uploads (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  b2_url TEXT NOT NULL,
  asset_id TEXT NULL,
  playback_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  final_content_id UUID NULL,
  CONSTRAINT video_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT video_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT video_uploads_status_check CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON public.video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_asset_id ON public.video_uploads(asset_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON public.video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_created_at ON public.video_uploads(created_at DESC);

-- Enable RLS on video_uploads table
ALTER TABLE public.video_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own video uploads
DROP POLICY IF EXISTS "Users can view their own video uploads" ON public.video_uploads;
CREATE POLICY "Users can view their own video uploads" ON public.video_uploads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy: Users can insert their own video uploads
DROP POLICY IF EXISTS "Users can insert their own video uploads" ON public.video_uploads;
CREATE POLICY "Users can insert their own video uploads" ON public.video_uploads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy: Service role (Edge Functions) can update video_uploads
-- This is handled automatically by using SUPABASE_SERVICE_ROLE_KEY in Edge Functions
