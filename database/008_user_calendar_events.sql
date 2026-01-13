-- =============================================
-- USER CALENDAR EVENTS TABLE
-- Stores events that users have added to their calendar
-- =============================================

-- 1. Create user_calendar_events table
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_time TEXT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event_id ON public.user_calendar_events(event_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_reminder_enabled ON public.user_calendar_events(reminder_enabled);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_reminder ON public.user_calendar_events(user_id, reminder_enabled);

-- 3. Create trigger for auto-update updated_at column
DROP TRIGGER IF EXISTS trigger_update_user_calendar_events_updated_at ON public.user_calendar_events;
CREATE TRIGGER trigger_update_user_calendar_events_updated_at
  BEFORE UPDATE ON public.user_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 1. Enable RLS on user_calendar_events table
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.user_calendar_events;

-- 3. Create new policies
-- Users can view their own calendar events
CREATE POLICY "Users can view their own calendar events"
  ON public.user_calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add events to their calendar
CREATE POLICY "Users can insert their own calendar events"
  ON public.user_calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar event settings (like reminder)
CREATE POLICY "Users can update their own calendar events"
  ON public.user_calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can remove events from their calendar
CREATE POLICY "Users can delete their own calendar events"
  ON public.user_calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
