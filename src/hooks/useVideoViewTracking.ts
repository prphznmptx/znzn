import { supabase } from '../lib/supabase';

// Simple function-based view tracking (no hook dependencies issues)
export const trackVideoView = async (contentId: string) => {
  if (!contentId) return;

  try {
    // Fetch current views
    const { data: currentData, error: fetchError } = await supabase
      .from('media_page_content')
      .select('views_count')
      .eq('id', contentId)
      .single();

    if (fetchError) {
      console.error('Error fetching view count:', fetchError);
      return;
    }

    const currentViews = currentData?.views_count || 0;

    // Update with incremented views
    const { error: updateError } = await supabase
      .from('media_page_content')
      .update({ views_count: currentViews + 1 })
      .eq('id', contentId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    }
  } catch (err) {
    console.error('Failed to track view:', err);
  }
};

// Hook version for backward compatibility
export const useSimpleVideoViewTracking = (contentId: string) => {
  const trackView = () => trackVideoView(contentId);
  return { trackView };
};
