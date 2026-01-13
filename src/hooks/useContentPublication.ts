import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PublicationResult {
  success: boolean;
  error?: string;
}

export function useContentPublication() {
  const publishToDestination = useCallback(
    async (contentId: string, destination: 'media' | 'masterclass' | 'portfolio', source?: 'media' | 'portfolio'): Promise<PublicationResult> => {
      try {
        // Determine which table to use based on source or content being published
        const tableName = source === 'portfolio' ? 'portfolio_page_content' : 'media_page_content';

        // Fetch current content to get published_to array
        const { data: currentContent, error: fetchError } = await supabase
          .from(tableName)
          .select('published_to, status')
          .eq('id', contentId)
          .single();

        if (fetchError) throw fetchError;
        if (!currentContent) {
          return { success: false, error: 'Content not found' };
        }

        // Add destination to published_to array if not already there
        const publishedTo = (currentContent.published_to || []) as string[];
        const updatedPublishedTo = [...new Set([...publishedTo, destination])]; // Remove duplicates

        // Update content
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            published_to: updatedPublishedTo,
            status: 'published',
            publication_destination: destination,
          })
          .eq('id', contentId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to publish content';
        console.error('Error publishing content:', err);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const unpublishFromDestination = useCallback(
    async (contentId: string, destination: 'media' | 'masterclass' | 'portfolio', source?: 'media' | 'portfolio'): Promise<PublicationResult> => {
      try {
        // Determine which table to use based on source or content being unpublished
        const tableName = source === 'portfolio' ? 'portfolio_page_content' : 'media_page_content';

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

        // If no destinations left, mark as pending deletion
        const newStatus = updatedPublishedTo.length === 0 ? 'pending_deletion' : 'published';

        // Update content
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            published_to: updatedPublishedTo,
            status: newStatus,
          })
          .eq('id', contentId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to unpublish content';
        console.error('Error unpublishing content:', err);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    publishToDestination,
    unpublishFromDestination,
  };
}
