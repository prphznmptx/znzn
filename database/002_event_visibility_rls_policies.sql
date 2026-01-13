-- =============================================
-- EVENT VISIBILITY AND VISIBILITY RLS POLICIES
-- Allows published events to be visible to ALL users including anon/public
-- Draft events only visible to creator
-- =============================================

-- 1. ENABLE RLS on events table (should already be enabled)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. DROP existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.events;
DROP POLICY IF EXISTS "Public users can view published events in Join tab" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view published events in Join tab" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- 3. CREATE NEW POLICIES

-- A. ANON (public/non-logged-in users) - Can only see published events in Join tab
CREATE POLICY "Public users can view published events in Join tab"
  ON public.events
  FOR SELECT
  TO anon
  USING (
    is_published = TRUE 
    AND is_visible_in_join_tab = TRUE 
    AND status = 'upcoming'
  );

-- B. AUTHENTICATED USERS - Can see all their own events + all published events
CREATE POLICY "Authenticated users can view their own events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = organizer_id
  );

CREATE POLICY "Authenticated users can view published events in Join tab"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    is_published = TRUE 
    AND is_visible_in_join_tab = TRUE 
    AND status = 'upcoming'
  );

-- C. AUTHENTICATED USERS - Can only insert, update, delete their own events
CREATE POLICY "Users can insert their own events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = organizer_id);

-- =============================================
-- VERIFY POLICIES (run separately to check)
-- =============================================
-- SELECT trigger_name, event_object_table, event_manipulation
-- FROM information_schema.triggers
-- WHERE event_object_table = 'events'
--   AND trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;
