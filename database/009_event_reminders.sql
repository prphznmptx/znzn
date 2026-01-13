-- =============================================
-- EVENT REMINDERS TABLE
-- Stores reminder preferences for user's calendar events
-- =============================================

-- 1. Update user_calendar_events table to add reminder details if needed
ALTER TABLE public.user_calendar_events
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_type TEXT DEFAULT 'in_app' CHECK (reminder_type IN ('in_app', 'email', 'push', 'all')),
ADD COLUMN IF NOT EXISTS reminder_time_before TEXT DEFAULT '24h' CHECK (reminder_time_before IN ('15m', '1h', '24h', 'week'));

-- 2. Create event_reminders table to track when reminders have been sent
CREATE TABLE IF NOT EXISTS public.event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reminder_scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_sent_at TIMESTAMP WITH TIME ZONE NULL,
    reminder_type TEXT NOT NULL DEFAULT 'in_app' CHECK (reminder_type IN ('in_app', 'email', 'push', 'all')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, event_id, reminder_scheduled_for)
);

-- 3. Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON public.event_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON public.event_reminders(status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled_for ON public.event_reminders(reminder_scheduled_for);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_calendar_events_reminder_enabled ON public.user_calendar_events(user_id, reminder_enabled);

-- 5. Create triggers for auto-update updated_at columns
DROP TRIGGER IF EXISTS trigger_update_event_reminders_updated_at ON public.event_reminders;
CREATE TRIGGER trigger_update_event_reminders_updated_at
  BEFORE UPDATE ON public.event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 1. Enable RLS on event_reminders table
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reminders" ON public.event_reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.event_reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.event_reminders;
DROP POLICY IF EXISTS "System can update reminders for scheduled notifications" ON public.event_reminders;

CREATE POLICY "Users can view their own reminders"
  ON public.event_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.event_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.event_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can update reminders for scheduled notifications
CREATE POLICY "System can update reminders for scheduled notifications"
  ON public.event_reminders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Enable RLS on push_subscriptions table
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
