import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface EditContentPayload {
  title: string;
  description?: string;
  category?: string;
  is_premium?: boolean;
}

export interface EditResult {
  success: boolean;
  error?: string;
}

export function useMediaPageEdit() {
  const [isOperating, setIsOperating] = useState<Set<string>>(new Set());

  const editContent = useCallback(
    async (contentId: string, payload: EditContentPayload & { level?: string; features?: string[]; lessons_count?: number }, source?: 'media' | 'portfolio' | 'masterclass'): Promise<EditResult> => {
      if (isOperating.has(contentId)) {
        return {
          success: false,
          error: 'Operation in progress',
        };
      }

      setIsOperating((prev) => new Set(prev).add(contentId));

      try {
        let tableName = 'media_page_content';
        if (source === 'portfolio') {
          tableName = 'portfolio_page_content';
        } else if (source === 'masterclass') {
          tableName = 'masterclass_page_content';
        }

        const updatePayload: any = {
          title: payload.title,
          description: payload.description || null,
          category: payload.category || null,
          is_premium: payload.is_premium ?? false,
        };

        // Add masterclass-specific fields if source is masterclass
        if (source === 'masterclass') {
          if (payload.level) {
            updatePayload.level = payload.level;
          }
          if (payload.features) {
            updatePayload.features = payload.features;
          }
          if (payload.lessons_count !== undefined) {
            updatePayload.lessons_count = payload.lessons_count;
          }
        }

        const { error } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq('id', contentId);

        if (error) throw error;

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to edit content';
        console.error('Error editing content:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsOperating((prev) => {
          const next = new Set(prev);
          next.delete(contentId);
          return next;
        });
      }
    },
    [isOperating]
  );

  const deleteContent = useCallback(
    async (contentId: string): Promise<EditResult> => {
      if (isOperating.has(contentId)) {
        return {
          success: false,
          error: 'Operation in progress',
        };
      }

      setIsOperating((prev) => new Set(prev).add(contentId));

      try {
        const { error } = await supabase
          .from('media_page_content')
          .update({ status: 'archived' })
          .eq('id', contentId);

        if (error) throw error;

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete content';
        console.error('Error deleting content:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsOperating((prev) => {
          const next = new Set(prev);
          next.delete(contentId);
          return next;
        });
      }
    },
    [isOperating]
  );

  return { editContent, deleteContent, isOperating };
}
