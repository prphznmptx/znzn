import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface EditContentModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  category?: string;
  isPremium?: boolean;
  publishedTo?: string[];
  status?: string;
  onSave: (payload: {
    title: string;
    description?: string;
    category?: string;
    is_premium?: boolean;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string;
}

export default function EditContentModal({
  isOpen,
  title: initialTitle,
  description: initialDescription,
  category: initialCategory,
  isPremium: initialPremium,
  publishedTo = [],
  status = 'draft',
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  isDeleting = false,
  error,
}: EditContentModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [isPremium, setIsPremium] = useState(initialPremium || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPublished = publishedTo && publishedTo.length > 0;
  const isPendingDeletion = status === 'pending_deletion';

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      category: category || undefined,
      is_premium: isPremium,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">Edit Content</h3>
          <button
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="p-6 space-y-4"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              placeholder="Content title"
              required
              disabled={isSaving || isDeleting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
              placeholder="Content description"
              rows={3}
              disabled={isSaving || isDeleting}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              disabled={isSaving || isDeleting}
            >
              <option value="">Select a category</option>
              <option value="music">Music</option>
              <option value="movie">Movies</option>
              <option value="documentary">Documentary</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="interviews">Interviews</option>
              <option value="photography">Photography</option>
              <option value="art">Art</option>
              <option value="design">Design</option>
            </select>
          </div>

          {/* Premium Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPremium"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4 text-rose-400 bg-gray-800 border-gray-700 rounded focus:ring-2 focus:ring-rose-400"
              disabled={isSaving || isDeleting}
            />
            <label htmlFor="isPremium" className="ml-2 text-sm text-white">
              Mark as premium content
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting || !title}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Delete Section - Only show for draft content or pending deletion */}
          {(status === 'draft' || isPendingDeletion) && onDelete && (
            <div className="pt-4 border-t border-gray-800">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving || isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isPendingDeletion ? 'Permanently Delete' : 'Delete Content'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    {isPendingDeletion
                      ? 'This will permanently delete your content. This action cannot be undone.'
                      : 'Are you sure you want to delete this content? It will be removed from your content library.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : (isPendingDeletion ? 'Permanently Delete' : 'Delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
