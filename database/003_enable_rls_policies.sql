-- 1. Enable RLS on 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Enable RLS on 'media_items' table
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all media items" ON public.media_items;
DROP POLICY IF EXISTS "Users can insert their own media items" ON public.media_items;
DROP POLICY IF EXISTS "Users can update their own media items" ON public.media_items;
DROP POLICY IF EXISTS "Users can delete their own media items" ON public.media_items;

CREATE POLICY "Authenticated users can view all media items" ON public.media_items
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own media items" ON public.media_items
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media items" ON public.media_items
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media items" ON public.media_items
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Enable RLS on 'media_likes' table
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view media likes" ON public.media_likes;
DROP POLICY IF EXISTS "Users can insert their own media likes" ON public.media_likes;
DROP POLICY IF EXISTS "Users can delete their own media likes" ON public.media_likes;

CREATE POLICY "Authenticated users can view media likes" ON public.media_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own media likes" ON public.media_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media likes" ON public.media_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Enable RLS on 'creator_follows' table
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.creator_follows;

CREATE POLICY "Authenticated users can view follows" ON public.creator_follows
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own follows" ON public.creator_follows
FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.creator_follows
FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 5. Enable RLS on 'tips' table
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view tips" ON public.tips;
DROP POLICY IF EXISTS "Users can insert tips" ON public.tips;

CREATE POLICY "Authenticated users can view tips" ON public.tips
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert tips" ON public.tips
FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
