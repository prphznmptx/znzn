import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DeletionResult {
  success: boolean;
  error?: string;
}

export interface ContentDeletionInfo {
  isDeletedPending: boolean;
  deletedAt: string | null;
  autoDeleteAt: string | null;
  saved: boolean;
  daysUntilDeletion: number | null;
}

export function useContentDeletion() {
  const deleteFromDestination = useCallback(
    async (contentId: string, destination: 'media' | 'masterclass' | 'portfolio', source?: 'media' | 'portfolio' | 'masterclass'): Promise<DeletionResult> => {
      try {
        // Determine which table to use
        let tableName = 'media_page_content';
        if (source === 'portfolio') {
          tableName = 'portfolio_page_content';
        } else if (source === 'masterclass') {
          tableName = 'masterclass_page_content';
        }

        // Fetch current content
        const { data: currentContent, error: fetchError } = await supabase
          .from(tableName)
          .select('published_to')
          .eq('id', contentId)
          .single();

        if (fetchError) throw fetchError;
        if (!currentContent) {
          return { success: false, error: 'Content not found' };
        }

        // Remove destination from published_to array
        const publishedTo = (currentContent.published_to || []) as string[];
        const updatedPublishedTo = publishedTo.filter((d) => d !== destination);

        // If no destinations left, mark as pending deletion with 3-day countdown
        const updatePayload: any = {
          published_to: updatedPublishedTo,
        };

        if (updatedPublishedTo.length === 0) {
          updatePayload.status = 'pending_deletion';
          updatePayload.is_deleted_pending = true;
          // The trigger will automatically set deleted_at and auto_delete_at
        } else {
          updatePayload.status = 'published';
        }

        // Update content
        const { error: updateError } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq('id', contentId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete content from destination';
        console.error('Error deleting content:', err);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const saveContent = useCallback(
    async (contentId: string, source?: 'media' | 'portfolio' | 'masterclass'): Promise<DeletionResult> => {
      try {
        // Determine which table to use
        let tableName = 'media_page_content';
        if (source === 'portfolio') {
          tableName = 'portfolio_page_content';
        } else if (source === 'masterclass') {
          tableName = 'masterclass_page_content';
        }

        // Update content to mark as saved (prevents auto-deletion)
        // The trigger will reset deleted_at, auto_delete_at, and status
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            saved: true,
          })
          .eq('id', contentId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save content';
        console.error('Error saving content:', err);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const restoreContent = useCallback(
    async (contentId: string, source?: 'media' | 'portfolio' | 'masterclass'): Promise<DeletionResult> => {
      try {
        // Determine which table to use
        let tableName = 'media_page_content';
        if (source === 'portfolio') {
          tableName = 'portfolio_page_content';
        } else if (source === 'masterclass') {
          tableName = 'masterclass_page_content';
        }

        // Restore content by unsaving it (but keep it in draft state)
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            saved: false,
            status: 'draft',
            deleted_at: null,
            auto_delete_at: null,
            is_deleted_pending: false,
            published_to: [],
          })
          .eq('id', contentId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to restore content';
        console.error('Error restoring content:', err);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const getDeletionInfo = (
    status: string,
    deletedAt: string | null,
    autoDeleteAt: string | null,
    saved: boolean
  ): ContentDeletionInfo => {
    const isDeletedPending = status === 'pending_deletion' && !saved;
    let daysUntilDeletion: number | null = null;

    if (autoDeleteAt && isDeletedPending) {
      const now = new Date();
      const deleteDate = new Date(autoDeleteAt);
      const diffTime = deleteDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilDeletion = Math.max(0, diffDays);
    }

    return {
      isDeletedPending,
      deletedAt,
      autoDeleteAt,
      saved,
      daysUntilDeletion,
    };
  };

  return {
    deleteFromDestination,
    saveContent,
    restoreContent,
    getDeletionInfo,
  };
}
