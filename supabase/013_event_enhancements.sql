-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS organizer_specification TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_livestream BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS livestream_link TEXT,
ADD COLUMN IF NOT EXISTS attractions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create event_service_bookings table
CREATE TABLE IF NOT EXISTS public.event_service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_category TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    base_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    booking_status TEXT NOT NULL DEFAULT 'pending',
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_service_bookings_event_id ON public.event_service_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_service_bookings_user_id ON public.event_service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_service_bookings_booking_status ON public.event_service_bookings(booking_status);

-- Enable RLS on event_service_bookings
ALTER TABLE public.event_service_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own event bookings" ON public.event_service_bookings;
DROP POLICY IF EXISTS "Users can insert their own event bookings" ON public.event_service_bookings;
DROP POLICY IF EXISTS "Users can update their own event bookings" ON public.event_service_bookings;
DROP POLICY IF EXISTS "Users can delete their own event bookings" ON public.event_service_bookings;

-- Create new RLS policies for event_service_bookings
CREATE POLICY "Users can view their own event bookings" ON public.event_service_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event bookings" ON public.event_service_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event bookings" ON public.event_service_bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event bookings" ON public.event_service_bookings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_service_bookings TO authenticated;
