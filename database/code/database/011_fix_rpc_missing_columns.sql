-- =============================================
-- FIX RPC FUNCTION - Handle missing columns on media_page_content
-- =============================================

DROP FUNCTION IF EXISTS public.get_content_by_destination(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.get_content_by_destination(destination TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  creator TEXT,
  description TEXT,
  type TEXT,
  category TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  duration TEXT,
  read_time TEXT,
  views_count INT,
  like_count INT,
  is_premium BOOLEAN,
  status TEXT,
  level TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF destination = 'media' THEN
    RETURN QUERY
    SELECT
      mpc.id,
      mpc.user_id,
      mpc.title,
      mpc.creator,
      mpc.description,
      mpc.type,
      mpc.category,
      mpc.thumbnail_url,
      mpc.content_url,
      mpc.duration,
      mpc.read_time,
      mpc.views_count,
      mpc.like_count,
      mpc.is_premium,
      mpc.status,
      'All Levels'::TEXT,
      '[]'::JSONB,
      mpc.created_at,
      mpc.updated_at
    FROM public.media_page_content mpc
    WHERE mpc.status = 'published'
    ORDER BY mpc.created_at DESC;

  ELSIF destination = 'masterclass' THEN
    RETURN QUERY
    SELECT
      mcc.id,
      mcc.user_id,
      mcc.title,
      mcc.creator,
      mcc.description,
      mcc.type,
      mcc.category,
      mcc.thumbnail_url,
      mcc.content_url,
      mcc.duration,
      mcc.read_time,
      mcc.views_count,
      mcc.like_count,
      mcc.is_premium,
      mcc.status,
      COALESCE(mcc.level, 'All Levels'),
      COALESCE(mcc.features, '[]'::jsonb),
      mcc.created_at,
      mcc.updated_at
    FROM public.masterclass_page_content mcc
    WHERE mcc.status = 'published'
    ORDER BY mcc.created_at DESC;

  ELSIF destination = 'portfolio' THEN
    RETURN QUERY
    SELECT
      ppc.id,
      ppc.user_id,
      ppc.title,
      ppc.creator,
      ppc.description,
      ppc.type,
      ppc.category,
      ppc.thumbnail_url,
      ppc.content_url,
      ppc.duration,
      ppc.read_time,
      ppc.views_count,
      ppc.like_count,
      ppc.is_premium,
      ppc.status,
      'All Levels'::TEXT,
      '[]'::JSONB,
      ppc.created_at,
      ppc.updated_at
    FROM public.portfolio_page_content ppc
    WHERE ppc.status = 'published'
    ORDER BY ppc.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_content_by_destination(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_by_destination(TEXT) TO anon;
