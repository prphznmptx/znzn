import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MediaItem from '../components/MediaItem';
import MediaUpload from '../components/MediaUpload';
import EditMediaModal from '../components/EditMediaModal';
import { LogOut } from 'lucide-react';
import { useLikeMedia, useFollowCreator } from '../hooks/useMediaInteraction';
import { useMediaEdit } from '../hooks/useMediaEdit';
import { useAuth } from '../context/AuthContext';

interface MediaItemData {
  id: string;
  user_id: string;
  title: string;
  creator: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  created_at: string;
  category?: string | null;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItemData[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userFollows, setUserFollows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingMedia, setEditingMedia] = useState<MediaItemData | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isEditDeleting, setIsEditDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const { toggleLike } = useLikeMedia();
  const { toggleFollow } = useFollowCreator();
  const { editMedia, deleteMedia } = useMediaEdit();

  useEffect(() => {
    if (user) {
      fetchMediaItems();
      fetchUserInteractions();
    }
  }, [user, refreshKey]);

  useEffect(() => {
    const unsubscribe = subscribeToRealTimeUpdates();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const fetchMediaItems = async () => {
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return;
    }

    setMediaItems(data || []);
  };

  const fetchUserInteractions = async () => {
    if (!user) return;

    const { data: likes, error: likesError } = await supabase
      .from('media_likes')
      .select('media_id')
      .eq('user_id', user.id);

    if (!likesError && likes) {
      setUserLikes(new Set(likes.map((l: any) => l.media_id)));
    }

    const { data: follows, error: followsError } = await supabase
      .from('creator_follows')
      .select('creator_name')
      .eq('follower_id', user.id);

    if (!followsError && follows) {
      setUserFollows(new Set(follows.map((f: any) => f.creator_name)));
    }
  };

  const subscribeToRealTimeUpdates = () => {
    const mediaChannel = supabase
      .channel('public:media_items')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'media_items',
        },
        (payload: any) => {
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? {
                    ...item,
                    like_count: payload.new.like_count,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel('public:media_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_likes',
        },
        () => {
          if (user) {
            fetchUserInteractions();
          }
        }
      )
      .subscribe();

    return () => {
      mediaChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  };

  const handleToggleLike = useCallback(
    async (mediaId: string) => {
      if (!user) return;

      const isCurrentlyLiked = userLikes.has(mediaId);
      const previousLikes = userLikes;
      const previousMediaItems = mediaItems;

      setUserLikes((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.delete(mediaId);
        } else {
          next.add(mediaId);
        }
        return next;
      });

      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === mediaId
            ? { ...item, like_count: isCurrentlyLiked ? item.like_count - 1 : item.like_count + 1 }
            : item
        )
      );

      const result = await toggleLike(mediaId, isCurrentlyLiked, user.id);

      if (!result.success) {
        setUserLikes(previousLikes);
        setMediaItems(previousMediaItems);
      }
    },
    [user, userLikes, mediaItems, toggleLike]
  );

  const handleToggleFollow = useCallback(
    async (creatorName: string) => {
      if (!user) return;

      const isCurrentlyFollowing = userFollows.has(creatorName);
      const previousFollows = userFollows;

      setUserFollows((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(creatorName);
        } else {
          next.add(creatorName);
        }
        return next;
      });

      const result = await toggleFollow(
        creatorName,
        isCurrentlyFollowing,
        user.id
      );

      if (!result.success) {
        setUserFollows(previousFollows);
      }
    },
    [user, userFollows, toggleFollow]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditOpen = (media: MediaItemData) => {
    setEditingMedia(media);
    setEditError(null);
  };

  const handleEditClose = () => {
    setEditingMedia(null);
    setEditError(null);
    setIsEditSaving(false);
    setIsEditDeleting(false);
  };

  const handleEditSave = async (payload: {
    title: string;
    description?: string;
    category?: string;
  }) => {
    if (!editingMedia) return;

    setIsEditSaving(true);
    setEditError(null);

    const result = await editMedia(editingMedia.id, payload);

    if (result.success) {
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === editingMedia.id
            ? {
                ...item,
                title: payload.title,
                description: payload.description || null,
              }
            : item
        )
      );
      handleEditClose();
    } else {
      setEditError('Failed to save changes. Please try again.');
    }

    setIsEditSaving(false);
  };

  const handleEditDelete = async () => {
    if (!editingMedia) return;

    setIsEditDeleting(true);
    setEditError(null);

    const result = await deleteMedia(editingMedia.id);

    if (result.success) {
      setMediaItems((prev) => prev.filter((item) => item.id !== editingMedia.id));
      handleEditClose();
    } else {
      setEditError('Failed to delete content. Please try again.');
      setIsEditDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="bg-slate-800/50 border-b border-white/10 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Creator Feed</h1>
            <p className="text-sm text-gray-300">
              {profile ? `Welcome, ${profile.name}` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.length > 0 ? (
            mediaItems.map((media) => (
              <MediaItem
                key={media.id}
                title={media.title}
                creator={media.creator}
                description={media.description || undefined}
                thumbnailUrl={media.thumbnail_url}
                likeCount={Math.max(0, media.like_count)}
                isLiked={userLikes.has(media.id)}
                isFollowing={userFollows.has(media.creator)}
                currentUserId={user?.id || ''}
                creatorId={media.user_id}
                onToggleLike={() => handleToggleLike(media.id)}
                onToggleFollow={() => handleToggleFollow(media.creator)}
                onEdit={() => handleEditOpen(media)}
                onDelete={() => handleEditOpen(media)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 text-lg">
                No content yet. Be the first to post!
              </p>
            </div>
          )}
        </div>
      </main>

      {editingMedia && (
        <EditMediaModal
          isOpen={!!editingMedia}
          title={editingMedia.title}
          description={editingMedia.description || undefined}
          category={editingMedia.category || undefined}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={handleEditClose}
          isSaving={isEditSaving}
          isDeleting={isEditDeleting}
          error={editError || undefined}
        />
      )}

      {user && profile && (
        <MediaUpload
          userId={user.id}
          userName={profile.name}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
