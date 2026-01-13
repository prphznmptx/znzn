import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url: string;
  content_url: string;
  like_count: number;
  views_count: number;
  is_premium: boolean;
  status: string;
  type: string;
  duration?: string;
  read_time?: string;
  created_at: string;
  publication_destination?: string;
  published_to?: string[];
  deleted_at?: string | null;
  auto_delete_at?: string | null;
  saved?: boolean;
  is_deleted_pending?: boolean;
  source?: 'media' | 'portfolio';
}

export function useMyContent(userId: string | undefined) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchUserContent = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch media content
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_page_content')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .neq('status', 'permanently_deleted')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Fetch portfolio content
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_page_content')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .neq('status', 'permanently_deleted')
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;

      // Combine both content sources with source identifier
      const mediaContent = (mediaData || []).map(item => ({
        ...item,
        source: 'media' as const
      }));

      const portfolioContent = (portfolioData || []).map(item => ({
        ...item,
        source: 'portfolio' as const
      }));

      const combinedContent = [...mediaContent, ...portfolioContent].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setContentItems(combinedContent);
      setError(null);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load your content');
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [userId]);

  useEffect(() => {
    if (!hasLoadedRef.current && userId) {
      fetchUserContent();
    }
  }, [userId, fetchUserContent]);

  // Subscribe to media_page_content changes
  useEffect(() => {
    if (!userId) return;

    const mediaChannel = supabase
      .channel('public:media_page_content')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_page_content',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newItem = { ...payload.new, source: 'media' as const };
            if (newItem.status !== 'archived' && newItem.status !== 'permanently_deleted') {
              setContentItems((prev) => [newItem, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = { ...payload.new, source: 'media' as const };
            setContentItems((prev) => {
              const itemIndex = prev.findIndex((item) => item.id === updatedItem.id && item.source === 'media');
              if (itemIndex === -1) {
                if (updatedItem.status !== 'archived' && updatedItem.status !== 'permanently_deleted') {
                  return [updatedItem, ...prev];
                }
                return prev;
              }

              if (updatedItem.status === 'archived' || updatedItem.status === 'permanently_deleted') {
                return prev.filter((item) => !(item.id === updatedItem.id && item.source === 'media'));
              }

              return prev.map((item) =>
                item.id === updatedItem.id && item.source === 'media' ? updatedItem : item
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setContentItems((prev) => prev.filter((item) => !(item.id === payload.old.id && item.source === 'media')));
          }
        }
      )
      .subscribe();

    return () => {
      mediaChannel.unsubscribe();
    };
  }, [userId]);

  // Subscribe to portfolio_page_content changes
  useEffect(() => {
    if (!userId) return;

    const portfolioChannel = supabase
      .channel('public:portfolio_page_content')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_page_content',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newItem = { ...payload.new, source: 'portfolio' as const };
            if (newItem.status !== 'archived' && newItem.status !== 'permanently_deleted') {
              setContentItems((prev) => [newItem, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = { ...payload.new, source: 'portfolio' as const };
            setContentItems((prev) => {
              const itemIndex = prev.findIndex((item) => item.id === updatedItem.id && item.source === 'portfolio');
              if (itemIndex === -1) {
                if (updatedItem.status !== 'archived' && updatedItem.status !== 'permanently_deleted') {
                  return [updatedItem, ...prev];
                }
                return prev;
              }

              if (updatedItem.status === 'archived' || updatedItem.status === 'permanently_deleted') {
                return prev.filter((item) => !(item.id === updatedItem.id && item.source === 'portfolio'));
              }

              return prev.map((item) =>
                item.id === updatedItem.id && item.source === 'portfolio' ? updatedItem : item
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setContentItems((prev) => prev.filter((item) => !(item.id === payload.old.id && item.source === 'portfolio')));
          }
        }
      )
      .subscribe();

    return () => {
      portfolioChannel.unsubscribe();
    };
  }, [userId]);

  const updateContentItem = useCallback((id: string, updates: Partial<ContentItem>, source?: 'media' | 'portfolio') => {
    setContentItems((prev) => {
      return prev.map((item) => {
        if (source) {
          return item.id === id && item.source === source ? { ...item, ...updates } : item;
        }
        return item.id === id ? { ...item, ...updates } : item;
      });
    });
  }, []);

  const removeContentItem = useCallback((id: string, source?: 'media' | 'portfolio') => {
    setContentItems((prev) => {
      if (source) {
        return prev.filter((item) => !(item.id === id && item.source === source));
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  return {
    contentItems,
    loading,
    error,
    updateContentItem,
    removeContentItem,
    refetch: fetchUserContent,
  };
}
