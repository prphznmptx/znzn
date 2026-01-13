-- =============================================
-- SYNC media_page_follows TO FOLLOWERS COUNT
-- Update profiles.followers when media_page_follows changes
-- =============================================

-- 1. Create function to update followers count when media_page_follows changes
DROP FUNCTION IF EXISTS public.update_followers_from_media_page() CASCADE;
CREATE FUNCTION public.update_followers_from_media_page()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      -- When a follow is added, find the creator's user ID and increment their followers
      UPDATE public.profiles 
      SET followers = followers + 1 
      WHERE name = NEW.creator_name;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      -- When a follow is removed, find the creator's user ID and decrement their followers
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

-- =============================================
-- VERIFY SETUP
-- =============================================

-- View all triggers on media_page_follows
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'media_page_follows' AND trigger_schema = 'public';

-- Verify profiles table has followers column
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'followers';
