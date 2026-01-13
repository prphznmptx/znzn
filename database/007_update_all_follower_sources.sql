-- =============================================
-- SYNC ALL FOLLOWER SOURCES TO FOLLOWERS COUNT
-- Update profiles.followers when any follow table changes
-- =============================================

-- 1. Create function to update followers count when media_page_follows changes
DROP FUNCTION IF EXISTS public.update_followers_from_media_page() CASCADE;
CREATE FUNCTION public.update_followers_from_media_page()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles 
      SET followers = followers + 1 
      WHERE name = NEW.creator_name;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.profiles 
      SET followers = GREATEST(followers - 1, 0) 
      WHERE name = OLD.creator_name;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 2. Create trigger on media_page_follows
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
      UPDATE public.profiles 
      SET followers = followers + 1 
      WHERE name = NEW.creator_name;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.profiles 
      SET followers = GREATEST(followers - 1, 0) 
      WHERE name = OLD.creator_name;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 4. Create trigger on creator_follows
DROP TRIGGER IF EXISTS update_followers_from_creator_follows_table ON public.creator_follows;
CREATE TRIGGER update_followers_from_creator_follows_table
  AFTER INSERT OR DELETE ON public.creator_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followers_from_creator_follows();

-- =============================================
-- REAL-TIME UPDATES
-- =============================================

-- Ensure media_page_follows is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_page_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
