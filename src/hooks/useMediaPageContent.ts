import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface MediaPageContent {
  id: string;
  user_id: string;
  title: string;
  creator: string;
  description: string | null;
  type: string;
  category: string | null;
  thumbnail_url: string;
  content_url: string | null;
  duration: string | null;
  read_time: string | null;
  views_count: number;
  like_count: number;
  is_premium: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  publication_destination: string;
  published_to: string[];
}

export function useMediaPageContent() {
  const [content, setContent] = useState<MediaPageContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async (filters?: {
    userId?: string;
    category?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('media_page_content')
        .select('*');

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContent(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (
    contentId: string,
    updates: Partial<MediaPageContent>
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('media_page_content')
        .update(updates)
        .eq('id', contentId);

      if (updateError) throw updateError;

      setContent(prev =>
        prev.map(item =>
          item.id === contentId ? { ...item, ...updates } : item
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteContent = useCallback(async (contentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('media_page_content')
        .delete()
        .eq('id', contentId);

      if (deleteError) throw deleteError;

      setContent(prev => prev.filter(item => item.id !== contentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    content,
    loading,
    error,
    fetchContent,
    updateContent,
    deleteContent,
  };
}
