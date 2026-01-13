-- Event Visibility and Soft Delete Management
-- Allows independent control of event visibility in My Events vs Join tab

-- Add visibility tracking columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_visible_in_my_events BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deleted_from_my_events_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible_in_join_tab BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_from_join_tab_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create indexes for visibility queries
CREATE INDEX IF NOT EXISTS idx_events_is_visible_in_my_events ON public.events(organizer_id, is_visible_in_my_events);
CREATE INDEX IF NOT EXISTS idx_events_is_visible_in_join_tab ON public.events(is_visible_in_join_tab);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);

-- Create function to soft-delete from My Events (hides from user but keeps in DB)
CREATE OR REPLACE FUNCTION public.hide_event_from_my_events(event_id UUID, user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE public.events
  SET is_visible_in_my_events = FALSE,
      deleted_from_my_events_at = NOW()
  WHERE id = event_id AND organizer_id = user_id;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Event hidden from My Events'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to soft-delete from Join tab (unpublishes but keeps in DB)
CREATE OR REPLACE FUNCTION public.hide_event_from_join_tab(event_id UUID, user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE public.events
  SET is_visible_in_join_tab = FALSE,
      is_published = FALSE,
      deleted_from_join_tab_at = NOW()
  WHERE id = event_id AND organizer_id = user_id;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Event removed from Join tab'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to publish event to Join tab
CREATE OR REPLACE FUNCTION public.publish_event_to_join_tab(event_id UUID, user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE public.events
  SET is_visible_in_join_tab = TRUE,
      is_published = TRUE,
      published_at = NOW(),
      deleted_from_join_tab_at = NULL
  WHERE id = event_id AND organizer_id = user_id;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Event published to Join tab'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore event to My Events
CREATE OR REPLACE FUNCTION public.restore_event_to_my_events(event_id UUID, user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE public.events
  SET is_visible_in_my_events = TRUE,
      deleted_from_my_events_at = NULL
  WHERE id = event_id AND organizer_id = user_id;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Event restored to My Events'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.hide_event_from_my_events(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_event_from_join_tab(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_event_to_join_tab(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_event_to_my_events(UUID, UUID) TO authenticated;

-- Update RLS policies for events to respect visibility columns
DROP POLICY IF EXISTS "Users can view all their own events in My Events" ON public.events;
DROP POLICY IF EXISTS "Public can view published events in Join tab" ON public.events;

CREATE POLICY "Users can view all their own events in My Events" ON public.events
  FOR SELECT TO authenticated 
  USING (auth.uid() = organizer_id AND is_visible_in_my_events = TRUE);

CREATE POLICY "Authenticated users can view all events for their own organizer" ON public.events
  FOR SELECT TO authenticated 
  USING (auth.uid() = organizer_id);

CREATE POLICY "Public can view published events in Join tab" ON public.events
  FOR SELECT TO anon 
  USING (is_visible_in_join_tab = TRUE AND is_published = TRUE);

CREATE POLICY "Authenticated users can view published events in Join tab" ON public.events
  FOR SELECT TO authenticated 
  USING (is_visible_in_join_tab = TRUE AND is_published = TRUE);
