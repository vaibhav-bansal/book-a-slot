-- Add Google Calendar integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN google_calendar_connected BOOLEAN DEFAULT false;

-- Create google_calendar_events table to track synced events
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(google_event_id, calendar_id)
);

-- Enable RLS for google_calendar_events
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

-- Google calendar events policies
CREATE POLICY "google_calendar_events_select_own" ON public.google_calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "google_calendar_events_insert_own" ON public.google_calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "google_calendar_events_update_own" ON public.google_calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "google_calendar_events_delete_own" ON public.google_calendar_events FOR DELETE USING (auth.uid() = user_id);
