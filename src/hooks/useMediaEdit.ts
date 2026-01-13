import { supabase } from '../lib/supabase';

interface EditMediaPayload {
  title: string;
  description?: string;
  category?: string;
}

interface UseMediaEditResult {
  isOperating: boolean;
  error: string | null;
  editMedia: (mediaId: string, payload: EditMediaPayload) => Promise<{ success: boolean }>;
  deleteMedia: (mediaId: string) => Promise<{ success: boolean }>;
}

export function useMediaEdit(): UseMediaEditResult {
  const editMedia = async (mediaId: string, payload: EditMediaPayload) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({
          title: payload.title,
          description: payload.description || null,
          category: payload.category || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mediaId);

      if (error) {
        console.error('Edit error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Edit media error:', err);
      return { success: false };
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      // Delete from database
      // Note: Files in Backblaze B2 are managed separately and can be deleted from the B2 console
      const { error: dbError } = await supabase
        .from('media_items')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete media error:', err);
      return { success: false };
    }
  };

  return {
    isOperating: false,
    error: null,
    editMedia,
    deleteMedia,
  };
}
