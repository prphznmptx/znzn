import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface PublicationStatusBadgeProps {
  status: string;
  publishedTo?: string[];
  isDeletedPending?: boolean;
  daysUntilDeletion?: number | null;
  saved?: boolean;
}

export default function PublicationStatusBadge({
  status,
  publishedTo = [],
  isDeletedPending = false,
  daysUntilDeletion,
  saved = false,
}: PublicationStatusBadgeProps) {
  // Determine publication status label
  const getPublicationLabel = (): { label: string; color: string; icon?: React.ReactNode } => {
    if (isDeletedPending && !saved) {
      return {
        label: `Disappearing in ${daysUntilDeletion || 0} day${daysUntilDeletion !== 1 ? 's' : ''}`,
        color: 'bg-red-500/20 text-red-400 border border-red-500/30',
        icon: <Clock className="w-3 h-3" />,
      };
    }

    if (!publishedTo || publishedTo.length === 0) {
      return {
        label: 'Not Published',
        color: 'bg-gray-400/20 text-gray-400',
      };
    }

    // Map publication destinations to labels
    const publishedLabels = publishedTo.map((dest) => {
      switch (dest) {
        case 'media':
          return 'Published to Media';
        case 'portfolio':
          return 'Displayed in Portfolio';
        default:
          return `Published to ${dest}`;
      }
    });

    // If published to multiple, show combined label
    if (publishedLabels.length > 1) {
      return {
        label: publishedLabels.join(', '),
        color: 'bg-green-500/20 text-green-400 border border-green-500/30',
      };
    }

    return {
      label: publishedLabels[0],
      color: 'bg-green-500/20 text-green-400 border border-green-500/30',
    };
  };

  const publicationInfo = getPublicationLabel();

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${publicationInfo.color}`}>
      {publicationInfo.icon && publicationInfo.icon}
      <span>{publicationInfo.label}</span>
    </div>
  );
}
