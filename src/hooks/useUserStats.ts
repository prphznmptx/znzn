import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UserStats {
  portfolio_views: number;
  followers: number;
  rating: number;
  loyalty_points: number;
}

interface MetricChanges {
  portfolio_views_change: number;
  followers_change: number;
  rating_change: number;
  loyalty_points_change: number;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [changes, setChanges] = useState<MetricChanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Record dashboard view in history for future comparisons
        await supabase.rpc('insert_dashboard_view', { p_user_id: user.id });

        // Fetch current stats
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('portfolio_views, followers, rating, loyalty_points')
          .eq('id', user.id)
          .single();

        if (profileErr) throw profileErr;

        const currentStats = {
          portfolio_views: profileData?.portfolio_views || 0,
          followers: profileData?.followers || 0,
          rating: profileData?.rating || 0,
          loyalty_points: profileData?.loyalty_points || 0,
        };

        setStats(currentStats);

        // Fetch metric changes since last view
        const { data: changesData, error: changesErr } = await supabase.rpc('get_metric_changes', {
          p_user_id: user.id,
        });

        if (changesErr) {
          console.error('Error fetching changes:', changesErr);
          setChanges({
            portfolio_views_change: 0,
            followers_change: 0,
            rating_change: 0,
            loyalty_points_change: 0,
          });
        } else if (changesData && changesData.length > 0) {
          setChanges(changesData[0]);
        }
      } catch (err: any) {
        setError(err.message);
        setStats({
          portfolio_views: 0,
          followers: 0,
          rating: 0,
          loyalty_points: 0,
        });
        setChanges({
          portfolio_views_change: 0,
          followers_change: 0,
          rating_change: 0,
          loyalty_points_change: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time updates on profiles
    const profileSubscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setStats({
              portfolio_views: payload.new.portfolio_views || 0,
              followers: payload.new.followers || 0,
              rating: payload.new.rating || 0,
              loyalty_points: payload.new.loyalty_points || 0,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to dashboard view history changes to update metrics
    const historySubscription = supabase
      .channel(`public:dashboard_view_history:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dashboard_view_history',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Recalculate changes when new history record is inserted
          const { data: changesData, error: changesErr } = await supabase.rpc('get_metric_changes', {
            p_user_id: user.id,
          });

          if (!changesErr && changesData && changesData.length > 0) {
            setChanges(changesData[0]);
          }
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      historySubscription.unsubscribe();
    };
  }, [user?.id]);

  return { stats, changes, loading, error };
}
