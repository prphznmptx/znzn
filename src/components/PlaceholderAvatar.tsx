import React from 'react';
import { User, Building, Users } from 'lucide-react';

interface PlaceholderAvatarProps {
  providerType?: 'talent' | 'team' | 'agency';
  className?: string;
}

export default function PlaceholderAvatar({
  providerType = 'talent',
  className = 'w-16 h-16'
}: PlaceholderAvatarProps) {
  const bgColor = {
    talent: 'bg-blue-500/20',
    team: 'bg-purple-500/20',
    agency: 'bg-rose-500/20'
  }[providerType];

  const iconColor = {
    talent: 'text-blue-400',
    team: 'text-purple-400',
    agency: 'text-rose-400'
  }[providerType];

  const Icon = {
    talent: User,
    team: Users,
    agency: Building
  }[providerType];

  return (
    <div className={`${className} ${bgColor} rounded-full flex items-center justify-center`}>
      <Icon className={`${iconColor} w-1/2 h-1/2`} />
    </div>
  );
}
