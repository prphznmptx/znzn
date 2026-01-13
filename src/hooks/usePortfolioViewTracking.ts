import { useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function usePortfolioViewTracking() {
  const { user } = useAuth();
  const viewTrackedRef = useRef<boolean>(false);
  const userIdRef = useRef<string | undefined>(undefined);

  const trackView = useCallback(async () => {
    if (!user) return;

    // Check if we've already tracked for this user in this component mount
    if (viewTrackedRef.current && userIdRef.current === user.id) {
      return;
    }

    viewTrackedRef.current = true;
    userIdRef.current = user.id;

    try {
      const { error: viewError } = await supabase
        .from('portfolio_views')
        .insert({
          portfolio_owner_id: user.id,
          viewed_at: new Date().toISOString(),
        });

      if (viewError && viewError.code !== 'PGRST116') {
        console.error('Error tracking portfolio view:', viewError);
        viewTrackedRef.current = false;
        return;
      }
    } catch (err) {
      console.error('Error in portfolio view tracking:', err);
      viewTrackedRef.current = false;
    }
  }, [user]);

  return { trackView };
}
