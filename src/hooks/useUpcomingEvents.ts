import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  attendees_count: number;
  location: string;
  organizer_name: string;
}

export function useUpcomingEvents(limit: number = 3) {
  const { user } = useAuth();
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error: err } = await supabase
          .from('events')
          .select('id, title, event_date, event_time, attendees_count, location, organizer_name')
          .eq('status', 'upcoming')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(limit);

        if (err) throw err;

        setEvents(data || []);
      } catch (err: any) {
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `status=eq.upcoming`,
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, limit]);

  return { events, loading, error };
}
