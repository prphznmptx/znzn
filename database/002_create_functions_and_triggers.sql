-- 1. Create function to auto-update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = NOW(); 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

-- 2. Create trigger on profiles table to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 3. Create trigger on media_items table to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_media_items_updated_at ON public.media_items;
CREATE TRIGGER trigger_update_media_items_updated_at 
BEFORE UPDATE ON public.media_items 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 4. Create function to auto-create a profile entry on new user sign-up
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'member')
  );
  RETURN NEW;
END;
$$;

-- 5. Create trigger on auth.users to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to update media_items like_count when media_likes change
-- IMPORTANT: This uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION update_media_item_like_count() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ 
BEGIN 
  IF TG_OP = 'INSERT' THEN 
    UPDATE public.media_items SET like_count = like_count + 1 WHERE id = NEW.media_id; 
    RETURN NEW; 
  ELSIF TG_OP = 'DELETE' THEN 
    UPDATE public.media_items SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.media_id; 
    RETURN OLD; 
  END IF; 
  RETURN NULL; 
END; 
$$;

-- 7. Create trigger on media_likes table to update like_count in media_items
DROP TRIGGER IF EXISTS update_media_item_like_count ON public.media_likes;
CREATE TRIGGER update_media_item_like_count 
AFTER INSERT OR DELETE ON public.media_likes 
FOR EACH ROW 
EXECUTE FUNCTION update_media_item_like_count();
