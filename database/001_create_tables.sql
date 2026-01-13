-- Enable the "uuid-ossp" extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the 'profiles' table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL DEFAULT 'member' CHECK (account_type IN ('creator', 'member')),
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'professional', 'elite')),
    loyalty_points INT NOT NULL DEFAULT 0,
    avatar_url TEXT NULL,
    bio TEXT NULL,
    joined_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create the 'media_items' table
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    creator TEXT NOT NULL,
    description TEXT NULL,
    type TEXT NOT NULL DEFAULT 'image',
    category TEXT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT NULL,
    read_time TEXT NULL,
    views_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create 'media_likes' junction table
CREATE TABLE IF NOT EXISTS public.media_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, media_id)
);

-- 4. Create 'creator_follows' junction table
CREATE TABLE IF NOT EXISTS public.creator_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, creator_name)
);

-- 5. Create 'tips' table
CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD', 'EUR', 'GBP')),
    message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON public.media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON public.media_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON public.media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON public.media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_follower_id ON public.creator_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator_name ON public.creator_follows(creator_name);
CREATE INDEX IF NOT EXISTS idx_tips_creator_name ON public.tips(creator_name);
