import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface EditMasterclassContentModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  features?: string[];
  lessonsCount?: number;
  isPremium?: boolean;
  status?: string;
  onSave: (payload: {
    title: string;
    description?: string;
    category?: string;
    level?: string;
    features?: string[];
    lessons_count?: number;
    is_premium?: boolean;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string;
}

export default function EditMasterclassContentModal({
  isOpen,
  title: initialTitle,
  description: initialDescription,
  category: initialCategory,
  level: initialLevel,
  features: initialFeatures,
  lessonsCount: initialLessonsCount,
  isPremium: initialPremium,
  status = 'draft',
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  isDeleting = false,
  error,
}: EditMasterclassContentModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [level, setLevel] = useState(initialLevel || 'All Levels');
  const [features, setFeatures] = useState<string[]>(initialFeatures || []);
  const [featureInput, setFeatureInput] = useState('');
  const [lessonsCount, setLessonsCount] = useState(initialLessonsCount || 0);
  const [isPremium, setIsPremium] = useState(initialPremium || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPendingDeletion = status === 'pending_deletion';

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (featureInput.trim() && features.length < 8) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      category: category || undefined,
      level: level || undefined,
      features: features.length > 0 ? features : undefined,
      lessons_count: lessonsCount || undefined,
      is_premium: isPremium,
    });
  };

  const courseCategories = [
    'digital-marketing',
    'brand-ambassador',
    'media-communications',
    'media-production',
    'art-&-design',
    'modelling',
    'dance-&-choreography',
    'acting',
    'critical-media-literacy',
    'film-video-production',
    'audio-production',
    'music',
    'event-management',
    'marketing-&-advertising',
    'AI-research-&-innovation',
    'business-development',
    'professional-development',
    'personal-development'
  ];

  const levelOptions = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'All Levels',
    'Beginner to Intermediate',
    'Beginner to Advanced',
    'Intermediate to Advanced'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h3 className="text-xl font-bold text-white">Edit Course</h3>
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
              placeholder="Course title"
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
              placeholder="Course description"
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
              {courseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Course Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              disabled={isSaving || isDeleting}
            >
              {levelOptions.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Lessons Count */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Number of Lessons
            </label>
            <input
              type="number"
              min="0"
              value={lessonsCount}
              onChange={(e) => setLessonsCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              placeholder="Number of lessons"
              disabled={isSaving || isDeleting}
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Course Features
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                placeholder="Add a feature (e.g., Live Sessions)"
                disabled={isSaving || isDeleting}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                disabled={!featureInput.trim() || features.length >= 8 || isSaving || isDeleting}
                className="px-4 py-3 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 transition-all disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-purple-400/20 text-purple-300 text-sm rounded-full flex items-center gap-2"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={isSaving || isDeleting}
                      className="text-purple-300 hover:text-purple-200 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  {isPendingDeletion ? 'Permanently Delete' : 'Delete Course'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    {isPendingDeletion
                      ? 'This will permanently delete your course. This action cannot be undone.'
                      : 'Are you sure you want to delete this course? It will be removed from the platform.'}
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
