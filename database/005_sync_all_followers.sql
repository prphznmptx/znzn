-- =============================================
-- SYNC ALL FOLLOWER SOURCES TO profiles.followers
-- Ensure all follow actions (from any table) update the follower count
-- =============================================

-- 1. Create function to update followers count when media_page_follows changes
DROP FUNCTION IF EXISTS public.update_followers_from_media_page() CASCADE;
CREATE FUNCTION public.update_followers_from_media_page()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      -- Find the creator by name and increment their follower count
      UPDATE public.profiles 
      SET followers = followers + 1 
      WHERE name = NEW.creator_name;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      -- Find the creator by name and decrement their follower count
      UPDATE public.profiles 
      SET followers = GREATEST(followers - 1, 0) 
      WHERE name = OLD.creator_name;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 2. Create trigger on media_page_follows to update followers count
DROP TRIGGER IF EXISTS update_followers_from_media_page_follows ON public.media_page_follows;
CREATE TRIGGER update_followers_from_media_page_follows
  AFTER INSERT OR DELETE ON public.media_page_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followers_from_media_page();

-- 3. Create function to update followers count when creator_follows changes
DROP FUNCTION IF EXISTS public.update_followers_from_creator_follows() CASCADE;
CREATE FUNCTION public.update_followers_from_creator_follows()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      -- Find the creator by name and increment their follower count
      UPDATE public.profiles 
      SET followers = followers + 1 
      WHERE name = NEW.creator_name;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      -- Find the creator by name and decrement their follower count
      UPDATE public.profiles 
      SET followers = GREATEST(followers - 1, 0) 
      WHERE name = OLD.creator_name;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 4. Create trigger on creator_follows to update followers count
DROP TRIGGER IF EXISTS update_followers_from_creator_follows_table ON public.creator_follows;
CREATE TRIGGER update_followers_from_creator_follows_table
  AFTER INSERT OR DELETE ON public.creator_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followers_from_creator_follows();

-- =============================================
-- VERIFY TRIGGERS ARE CREATED
-- =============================================

-- Check all triggers on follow-related tables
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('media_page_follows', 'creator_follows', 'followers')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%followers%'
ORDER BY routine_name;
