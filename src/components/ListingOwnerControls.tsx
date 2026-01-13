import React, { useState } from 'react';
import { Edit2, Trash2, MoreVertical, X } from 'lucide-react';

interface ListingOwnerControlsProps {
  listingId: string;
  listingName: string;
  listingType: 'talent' | 'team' | 'agency' | 'job';
  onEdit: () => void;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

export function ListingOwnerControls({
  listingId,
  listingName,
  listingType,
  onEdit,
  onDelete,
  isLoading = false,
}: ListingOwnerControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${listingName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
      setIsOpen(false);
    } catch (error) {
      alert('Failed to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
        title="Manage listing"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Manage Listing</p>
                <p className="text-white font-medium text-sm line-clamp-1">{listingName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            {/* Edit Button */}
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              disabled={isLoading || isDeleting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-blue-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Edit2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
              <span>Edit Listing</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Listing'}</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <p className="text-xs text-gray-500">ID: {listingId.slice(0, 8)}...</p>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
