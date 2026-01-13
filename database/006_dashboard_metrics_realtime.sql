-- =============================================
-- PROJECT RATINGS TABLE
-- Track ratings given to talents/teams/agencies
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id INT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('talent', 'team', 'agency')),
    target_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(rater_id, target_id, target_type)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_project_ratings_target ON public.project_ratings(target_type, target_name);
CREATE INDEX IF NOT EXISTS idx_project_ratings_rater_id ON public.project_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_created_at ON public.project_ratings(created_at DESC);

-- =============================================
-- DASHBOARD VIEW HISTORY
-- Track when users view dashboard for metric comparisons
-- =============================================

CREATE TABLE IF NOT EXISTS public.dashboard_view_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_views INT NOT NULL DEFAULT 0,
    followers INT NOT NULL DEFAULT 0,
    rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    loyalty_points INT NOT NULL DEFAULT 0,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_view_history_user_id ON public.dashboard_view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_view_history_viewed_at ON public.dashboard_view_history(viewed_at DESC);

-- =============================================
-- FUNCTION TO CALCULATE METRIC CHANGES
-- Returns the change since last dashboard view
-- =============================================

DROP FUNCTION IF EXISTS public.get_metric_changes(uuid) CASCADE;
CREATE FUNCTION public.get_metric_changes(p_user_id uuid)
RETURNS TABLE(
    portfolio_views_change INT,
    followers_change INT,
    rating_change DECIMAL,
    loyalty_points_change INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.portfolio_views, 0) - COALESCE(dh.portfolio_views, 0) as portfolio_views_change,
    COALESCE(p.followers, 0) - COALESCE(dh.followers, 0) as followers_change,
    COALESCE(p.rating, 0) - COALESCE(dh.rating, 0) as rating_change,
    COALESCE(p.loyalty_points, 0) - COALESCE(dh.loyalty_points, 0) as loyalty_points_change
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      user_id, 
      portfolio_views, 
      followers, 
      rating, 
      loyalty_points,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY viewed_at DESC) as rn
    FROM public.dashboard_view_history
  ) dh ON p.id = dh.user_id AND dh.rn = 1
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- FUNCTION TO CALCULATE AVERAGE RATING
-- Calculates average rating for a talent/team/agency
-- =============================================

DROP FUNCTION IF EXISTS public.get_average_rating(text, text) CASCADE;
CREATE FUNCTION public.get_average_rating(p_target_type text, p_target_name text)
RETURNS DECIMAL AS $$
  SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)
  FROM public.project_ratings
  WHERE target_type = p_target_type
    AND target_name = p_target_name
$$ LANGUAGE SQL STABLE;

-- =============================================
-- FUNCTION TO INSERT DASHBOARD VIEW RECORD
-- Records current metrics snapshot when user views dashboard
-- =============================================

DROP FUNCTION IF EXISTS public.insert_dashboard_view(uuid) CASCADE;
CREATE FUNCTION public.insert_dashboard_view(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.dashboard_view_history (
    user_id,
    portfolio_views,
    followers,
    rating,
    loyalty_points,
    viewed_at
  )
  SELECT
    p_user_id,
    COALESCE(portfolio_views, 0),
    COALESCE(followers, 0),
    COALESCE(rating, 0),
    COALESCE(loyalty_points, 0),
    NOW()
  FROM public.profiles
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.project_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.project_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.project_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.project_ratings;

CREATE POLICY "Authenticated users can view ratings" ON public.project_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own ratings" ON public.project_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can delete their own ratings" ON public.project_ratings
  FOR DELETE TO authenticated USING (auth.uid() = rater_id);

ALTER TABLE public.dashboard_view_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own dashboard history" ON public.dashboard_view_history;
DROP POLICY IF EXISTS "System can insert dashboard view records" ON public.dashboard_view_history;

CREATE POLICY "Users can view their own dashboard history" ON public.dashboard_view_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert dashboard view records" ON public.dashboard_view_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
