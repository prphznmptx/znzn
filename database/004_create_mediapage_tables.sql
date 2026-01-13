-- =============================================
-- MEDIA PAGE CONTENT SYSTEM
-- Tables and functions for Media and Content pages
-- Separate from FeedPage media_items
-- =============================================

-- 1. Create the 'media_page_content' table (for Content uploads)
CREATE TABLE IF NOT EXISTS public.media_page_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    creator TEXT NOT NULL,
    description TEXT NULL,
    type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('music-video', 'movie', 'audio-music', 'blog', 'image', 'document')),
    category TEXT NULL,
    thumbnail_url TEXT NOT NULL,
    content_url TEXT NULL,
    duration TEXT NULL,
    read_time TEXT NULL,
    views_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create 'media_page_likes' junction table
CREATE TABLE IF NOT EXISTS public.media_page_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.media_page_content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, content_id)
);

-- 3. Create 'media_page_follows' junction table (for following creators on media page)
CREATE TABLE IF NOT EXISTS public.media_page_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, creator_name)
);

-- 4. Create 'media_page_tips' table
CREATE TABLE IF NOT EXISTS public.media_page_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD', 'EUR', 'GBP')),
    message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_page_content_user_id ON public.media_page_content(user_id);
CREATE INDEX IF NOT EXISTS idx_media_page_content_created_at ON public.media_page_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_page_content_category ON public.media_page_content(category);
CREATE INDEX IF NOT EXISTS idx_media_page_content_type ON public.media_page_content(type);
CREATE INDEX IF NOT EXISTS idx_media_page_likes_user_id ON public.media_page_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_page_likes_content_id ON public.media_page_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_media_page_follows_follower_id ON public.media_page_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_media_page_follows_creator_name ON public.media_page_follows(creator_name);
CREATE INDEX IF NOT EXISTS idx_media_page_tips_creator_name ON public.media_page_tips(creator_name);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- 1. Create trigger on media_page_content table to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_media_page_content_updated_at ON public.media_page_content;
CREATE TRIGGER trigger_update_media_page_content_updated_at
  BEFORE UPDATE ON public.media_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Create function to update media_page_content like_count when media_page_likes change
DROP FUNCTION IF EXISTS public.update_media_page_content_like_count() CASCADE;
CREATE FUNCTION public.update_media_page_content_like_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.media_page_content SET like_count = like_count + 1 WHERE id = NEW.content_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.media_page_content SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.content_id;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 3. Create trigger on media_page_likes table to update like_count in media_page_content
DROP TRIGGER IF EXISTS update_media_page_content_like_count ON public.media_page_likes;
CREATE TRIGGER update_media_page_content_like_count
  AFTER INSERT OR DELETE ON public.media_page_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_page_content_like_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 1. Enable RLS on 'media_page_content' table
ALTER TABLE public.media_page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all media_page_content" ON public.media_page_content;
DROP POLICY IF EXISTS "Users can insert their own media_page_content" ON public.media_page_content;
DROP POLICY IF EXISTS "Users can update their own media_page_content" ON public.media_page_content;
DROP POLICY IF EXISTS "Users can delete their own media_page_content" ON public.media_page_content;

CREATE POLICY "Authenticated users can view all media_page_content" ON public.media_page_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own media_page_content" ON public.media_page_content
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media_page_content" ON public.media_page_content
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media_page_content" ON public.media_page_content
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Enable RLS on 'media_page_likes' table
ALTER TABLE public.media_page_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view media_page_likes" ON public.media_page_likes;
DROP POLICY IF EXISTS "Users can insert their own media_page_likes" ON public.media_page_likes;
DROP POLICY IF EXISTS "Users can delete their own media_page_likes" ON public.media_page_likes;

CREATE POLICY "Authenticated users can view media_page_likes" ON public.media_page_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own media_page_likes" ON public.media_page_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media_page_likes" ON public.media_page_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Enable RLS on 'media_page_follows' table
ALTER TABLE public.media_page_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view media_page_follows" ON public.media_page_follows;
DROP POLICY IF EXISTS "Users can insert their own media_page_follows" ON public.media_page_follows;
DROP POLICY IF EXISTS "Users can delete their own media_page_follows" ON public.media_page_follows;

CREATE POLICY "Authenticated users can view media_page_follows" ON public.media_page_follows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own media_page_follows" ON public.media_page_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own media_page_follows" ON public.media_page_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 4. Enable RLS on 'media_page_tips' table
ALTER TABLE public.media_page_tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view media_page_tips" ON public.media_page_tips;
DROP POLICY IF EXISTS "Users can insert media_page_tips" ON public.media_page_tips;

CREATE POLICY "Authenticated users can view media_page_tips" ON public.media_page_tips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert media_page_tips" ON public.media_page_tips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- =============================================
-- STORAGE BUCKET POLICY (for media_page_content)
-- =============================================

-- Note: You need to manually create a storage bucket named 'media_page_content' in Supabase
-- Then run this policy to enable uploads/deletes:

-- ALTER TABLE "storage"."objects" 
--   ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Enable delete for media_page_content uploads" 
--   ON storage.objects FOR DELETE USING (
--     bucket_id = 'media_page_content' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Enable upload for media_page_content uploads"
--   ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'media_page_content'
--   );

-- CREATE POLICY "Enable public read for media_page_content"
--   ON storage.objects FOR SELECT USING (
--     bucket_id = 'media_page_content'
--   );
