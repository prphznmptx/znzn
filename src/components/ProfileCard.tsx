import { Profile } from '../lib/supabase';
import { User } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  currentUserId: string;
}

export default function ProfileCard({ profile, currentUserId }: ProfileCardProps) {
  const isOwnProfile = profile.id === currentUserId;
  const displayName = profile.name || 'Anonymous';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-24"></div>

      <div className="relative px-4 pt-0 pb-4">
        <div className="flex flex-col items-center -mt-12 mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center">
              <User className="w-12 h-12 text-slate-400" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-800 text-center mb-1">
          {displayName}
        </h3>

        <p className="text-sm text-slate-500 text-center mb-2">
          {profile.account_type === 'creator' ? '⭐ Creator' : '👤 Member'}
        </p>

        {isOwnProfile && (
          <div className="text-center mb-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
              Your Profile
            </span>
          </div>
        )}

        <p className="text-slate-600 text-center text-sm mb-4 min-h-12">
          {profile.bio || 'No bio added yet'}
        </p>

        <div className="text-xs text-slate-400 text-center mb-3">
          Joined {new Date(profile.joined_date || profile.created_at).toLocaleDateString()}
        </div>

        {profile.tier !== 'free' && (
          <div className="text-center mb-3">
            <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-600 bg-amber-50 rounded">
              {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
            </span>
          </div>
        )}

        <div className="text-center text-xs text-slate-500">
          {profile.loyalty_points > 0 && `🎁 ${profile.loyalty_points} loyalty points`}
        </div>
      </div>
    </div>
  );
}
