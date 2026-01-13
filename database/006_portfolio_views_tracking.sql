-- =============================================
-- PORTFOLIO VIEWS TRACKING
-- Tables and functions for tracking portfolio views
-- =============================================

-- 1. Create portfolio_views table to track individual portfolio views
CREATE TABLE IF NOT EXISTS public.portfolio_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(portfolio_owner_id, viewed_by_id, viewed_at)
);

-- 2. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_portfolio_views_owner_id ON public.portfolio_views(portfolio_owner_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewed_at ON public.portfolio_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewed_by_id ON public.portfolio_views(viewed_by_id);

-- =============================================
-- FOLLOWERS TABLE
-- Table to track follower relationships
-- =============================================

-- 1. Create followers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- 1. Create function to update followers count in profiles
DROP FUNCTION IF EXISTS public.update_followers_count() CASCADE;
CREATE FUNCTION public.update_followers_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET followers = followers + 1 WHERE id = NEW.following_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.profiles SET followers = GREATEST(followers - 1, 0) WHERE id = OLD.following_id;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 2. Create trigger on followers table to update followers count
DROP TRIGGER IF EXISTS update_followers_count ON public.followers;
CREATE TRIGGER update_followers_count
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followers_count();

-- 3. Create function to update portfolio_views count in profiles
DROP FUNCTION IF EXISTS public.update_portfolio_views_count() CASCADE;
CREATE FUNCTION public.update_portfolio_views_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET portfolio_views = portfolio_views + 1 WHERE id = NEW.portfolio_owner_id;
      RETURN NEW;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 4. Create trigger on portfolio_views table to update portfolio_views count
DROP TRIGGER IF EXISTS update_portfolio_views_count ON public.portfolio_views;
CREATE TRIGGER update_portfolio_views_count
  AFTER INSERT ON public.portfolio_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_portfolio_views_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 1. Enable RLS on portfolio_views table
ALTER TABLE public.portfolio_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view portfolio_views" ON public.portfolio_views;
DROP POLICY IF EXISTS "Users can insert portfolio_views" ON public.portfolio_views;

CREATE POLICY "Users can view portfolio_views" ON public.portfolio_views
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert portfolio_views" ON public.portfolio_views
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Enable RLS on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all followers" ON public.followers;
DROP POLICY IF EXISTS "Users can insert their own follows" ON public.followers;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.followers;

CREATE POLICY "Users can view all followers" ON public.followers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own follows" ON public.followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.followers
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- =============================================
-- MIGRATION: Create view for follower/following counts
-- =============================================

DROP VIEW IF EXISTS public.follower_stats CASCADE;
CREATE VIEW public.follower_stats AS
SELECT 
  p.id,
  p.name,
  p.followers,
  (SELECT COUNT(*) FROM public.followers WHERE follower_id = p.id) as following_count,
  (SELECT COUNT(*) FROM public.portfolio_views WHERE portfolio_owner_id = p.id) as portfolio_views
FROM public.profiles p;
