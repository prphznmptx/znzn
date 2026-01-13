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

export function useLikeMedia() {
  const [isOperating, setIsOperating] = useState<Set<string>>(new Set());

  const toggleLike = useCallback(
    async (
      mediaId: string,
      currentLiked: boolean,
      userId: string
    ): Promise<LikeToggleResult> => {
      if (isOperating.has(mediaId)) {
        return {
          success: false,
          newCount: 0,
          newIsLiked: currentLiked,
          error: 'Operation in progress',
        };
      }

      setIsOperating((prev) => new Set(prev).add(mediaId));

      try {
        if (currentLiked) {
          const { error: deleteError } = await supabase
            .from('media_likes')
            .delete()
            .match({ media_id: mediaId, user_id: userId });

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase
            .from('media_likes')
            .insert([{ media_id: mediaId, user_id: userId }]);

          if (insertError) throw insertError;
        }

        const { data: mediaData, error: fetchError } = await supabase
          .from('media_items')
          .select('like_count')
          .eq('id', mediaId)
          .single();

        if (fetchError) throw fetchError;

        return {
          success: true,
          newCount: mediaData?.like_count ?? 0,
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
          next.delete(mediaId);
          return next;
        });
      }
    },
    [isOperating]
  );

  return { toggleLike, isOperating };
}

export function useFollowCreator() {
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
            .from('creator_follows')
            .delete()
            .match({ follower_id: userId, creator_name: creatorName });

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase
            .from('creator_follows')
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
