-- =============================================
-- DASHBOARD TABLES & COLUMNS MIGRATION
-- Tables and functions for Dashboard page
-- =============================================

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS portfolio_views INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0;

-- 2. Create user_activities table (for Recent Activity section)
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'other' CHECK (action_type IN ('update', 'follower', 'approval', 'other')),
    action TEXT NOT NULL,
    related_entity_id UUID NULL,
    related_entity_type TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create challenges table (for Active Challenges section)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NULL,
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    reward TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    target_count INT NULL,
    current_count INT NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create events table (for Upcoming Events section)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NULL,
    category TEXT NOT NULL DEFAULT 'networking' CHECK (category IN ('social', 'networking', 'business', 'workshop', 'conference', 'masterclass')),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organizer_name TEXT NOT NULL,
    image_url TEXT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    capacity INT NOT NULL,
    attendees_count INT NOT NULL DEFAULT 0,
    rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    reviews_count INT NOT NULL DEFAULT 0,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    speakers TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_livestream BOOLEAN NOT NULL DEFAULT FALSE,
    livestream_url TEXT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create event_registrations table (for tracking user registrations)
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON public.user_activities(action_type);

CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON public.challenges(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);

-- 7. Create triggers for auto-update updated_at columns
DROP TRIGGER IF EXISTS trigger_update_user_activities_updated_at ON public.user_activities;
CREATE TRIGGER trigger_update_user_activities_updated_at
  BEFORE UPDATE ON public.user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_challenges_updated_at ON public.challenges;
CREATE TRIGGER trigger_update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON public.events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to update attendees_count in events when registrations change
DROP FUNCTION IF EXISTS public.update_event_attendees_count() CASCADE;
CREATE FUNCTION public.update_event_attendees_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.events SET attendees_count = attendees_count + 1 WHERE id = NEW.event_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.status != 'cancelled' THEN
      UPDATE public.events SET attendees_count = GREATEST(attendees_count - 1, 0) WHERE id = OLD.event_id;
      RETURN OLD;
    END IF;
    RETURN NULL;
  END;
  $$;

-- 9. Create trigger on event_registrations to update attendees_count
DROP TRIGGER IF EXISTS update_event_attendees_count ON public.event_registrations;
CREATE TRIGGER update_event_attendees_count
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_attendees_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 1. Enable RLS on user_activities table
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON public.user_activities;

CREATE POLICY "Users can view their own activities" ON public.user_activities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert activities" ON public.user_activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Enable RLS on challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.challenges;

CREATE POLICY "Users can view their own challenges" ON public.challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges" ON public.challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.challenges
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 3. Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Authenticated users can view all events" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- 4. Enable RLS on event_registrations table
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can delete their own registrations" ON public.event_registrations;

CREATE POLICY "Users can view all registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own registrations" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.event_registrations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registrations" ON public.event_registrations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
