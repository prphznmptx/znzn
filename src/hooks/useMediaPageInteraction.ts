import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LikeToggleResult {
  success: boolean;
  newCount: number;
  newIsLiked: boolean;
  error?: string;
}

export interface FollowToggleResult {
  success: boolean;
  error?: string;
}

export function useMediaPageLike() {
  const [isOperating, setIsOperating] = useState<Set<string>>(new Set());

  const toggleLike = useCallback(
    async (
      contentId: string,
      currentLiked: boolean,
      userId: string
    ): Promise<LikeToggleResult> => {
      if (isOperating.has(contentId)) {
        return {
          success: false,
          newCount: 0,
          newIsLiked: currentLiked,
          error: 'Operation in progress',
        };
      }

      setIsOperating((prev) => new Set(prev).add(contentId));

      try {
        if (currentLiked) {
          const { error: deleteError } = await supabase
            .from('media_page_likes')
            .delete()
            .match({ content_id: contentId, user_id: userId });

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase
            .from('media_page_likes')
            .insert([{ content_id: contentId, user_id: userId }]);

          if (insertError) throw insertError;
        }

        const { data: contentData, error: fetchError } = await supabase
          .from('media_page_content')
          .select('like_count')
          .eq('id', contentId)
          .single();

        if (fetchError) throw fetchError;

        return {
          success: true,
          newCount: contentData?.like_count ?? 0,
          newIsLiked: !currentLiked,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to toggle like';
        console.error('Error toggling like:', err);

        return {
          success: false,
          newCount: 0,
          newIsLiked: currentLiked,
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

  return { toggleLike, isOperating };
}

export function useMediaPageFollow() {
  const [isOperating, setIsOperating] = useState<Set<string>>(new Set());

  const toggleFollow = useCallback(
    async (
      creatorName: string,
      currentFollowing: boolean,
      userId: string
    ): Promise<FollowToggleResult> => {
      const opKey = `${userId}-${creatorName}`;

      if (isOperating.has(opKey)) {
        return {
          success: false,
          error: 'Operation in progress',
        };
      }

      setIsOperating((prev) => new Set(prev).add(opKey));

      try {
        if (currentFollowing) {
          const { error: deleteError } = await supabase
            .from('media_page_follows')
            .delete()
            .match({ follower_id: userId, creator_name: creatorName });

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase
            .from('media_page_follows')
            .insert([{ follower_id: userId, creator_name: creatorName }]);

          if (insertError) throw insertError;
        }

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to toggle follow';
        console.error('Error toggling follow:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsOperating((prev) => {
          const next = new Set(prev);
          next.delete(opKey);
          return next;
        });
      }
    },
    [isOperating]
  );

  return { toggleFollow, isOperating };
}
