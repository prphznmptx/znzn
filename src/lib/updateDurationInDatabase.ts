import { supabase } from './supabase';
import { extractDuration } from './getDuration';

export const updateDurationInDatabase = async (contentId: string, videoUrl: string): Promise<string | null> => {
  try {
    // Fetch the video and extract duration
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error('Failed to fetch video');
    
    const blob = await response.blob();
    const file = new File([blob], 'temp-video', { type: blob.type });
    
    const duration = await extractDuration(file);
    
    // Update database if duration is valid
    if (duration && duration !== '0:00') {
      await supabase
        .from('media_page_content')
        .update({ duration })
        .eq('id', contentId);
      
      return duration;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to auto-update duration:', error);
    return null;
  }
};
