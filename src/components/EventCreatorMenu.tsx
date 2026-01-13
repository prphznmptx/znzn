import React, { useState } from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { hideEventFromJoinTab } from '../lib/eventServices';
import type { Event } from '../types/events';

interface EventCreatorMenuProps {
  event: Event;
  currentUserId: string | undefined;
  onEventUpdated: () => void;
  onEdit?: (event: Event) => void;
}

export default function EventCreatorMenu({
  event,
  currentUserId,
  onEventUpdated,
  onEdit,
}: EventCreatorMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only show menu if current user is the event creator
  if (!currentUserId || currentUserId !== event.organizer_id) {
    return null;
  }

  const handleRemoveFromJoinTab = async () => {
    if (!currentUserId) return;

    if (!confirm('Remove this event from the Join tab? (It stays in your My Events)')) return;

    setIsLoading(true);
    try {
      const { success, error } = await hideEventFromJoinTab(event.id, currentUserId);

      if (error) {
        alert(`Error removing event: ${error}`);
        return;
      }

      alert('✓ Event removed from Join tab.');
      onEventUpdated();
    } catch (err) {
      console.error('Error:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
    } else {
      alert('Event editing coming soon! You can edit from My Events section.');
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
        className="p-2 hover:bg-white/10 rounded-lg transition-all"
        title="Event options (creator only)"
      >
        <MoreVertical className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-lg z-50 min-w-48">
          <button
            onClick={handleEdit}
            disabled={isLoading}
            className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Event</span>
          </button>

          <button
            onClick={handleRemoveFromJoinTab}
            disabled={isLoading}
            className="w-full px-4 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2 transition-all disabled:opacity-50 border-t border-white/10"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isLoading ? 'Removing...' : 'Remove from Join'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
