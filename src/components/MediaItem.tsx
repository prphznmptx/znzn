import { Heart, UserPlus, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface MediaItemProps {
  title: string;
  creator: string;
  description?: string;
  thumbnailUrl: string;
  likeCount: number;
  isLiked: boolean;
  isFollowing: boolean;
  currentUserId: string;
  creatorId: string;
  creatorProfile?: Profile;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLikeOperating?: boolean;
  isFollowOperating?: boolean;
}

export default function MediaItem({
  title,
  creator,
  description,
  thumbnailUrl,
  likeCount,
  isLiked,
  isFollowing,
  currentUserId,
  creatorId,
  onToggleLike,
  onToggleFollow,
  onEdit,
  onDelete,
}: MediaItemProps) {
  const isOwnContent = currentUserId === creatorId;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="relative h-64 overflow-hidden bg-slate-100">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3C/svg%3E';
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-2">{title}</h3>

        <p className="text-sm text-slate-500 mb-3">
          by <span className="font-semibold text-slate-700">{creator}</span>
        </p>

        {description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          {isOwnContent ? (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition bg-blue-50 text-blue-600 hover:bg-blue-100"
                title="Edit this content"
              >
                <Edit2 className="w-5 h-5" />
                <span className="text-sm">Edit</span>
              </button>

              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition bg-red-50 text-red-600 hover:bg-red-100"
                title="Delete this content"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm">Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onToggleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                  isLiked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{Math.max(0, likeCount)}</span>
              </button>

              <button
                onClick={onToggleFollow}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                  isFollowing
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span className="text-sm">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span className="text-sm">Follow</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
