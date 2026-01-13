import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Activity {
  id: string;
  action_type: 'update' | 'follower' | 'approval' | 'other';
  action: string;
  created_at: string;
}

export function useUserActivity(limit: number = 10) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedActivities = (data || []).map((item: any) => ({
          id: item.id,
          action_type: item.action_type || 'other',
          action: item.action || 'Activity',
          created_at: item.created_at,
        }));

        setActivities(formattedActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`public:user_activities:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const newActivity: Activity = {
              id: payload.new.id,
              action_type: payload.new.action_type || 'other',
              action: payload.new.action || 'Activity',
              created_at: payload.new.created_at,
            };
            setActivities((prev) => [newActivity, ...(prev || [])].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, limit]);

  return { activities, loading };
}
