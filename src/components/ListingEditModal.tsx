import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ProjectsPageProvider } from '../hooks/useProjectsPageProviders';

interface ListingEditModalProps {
  listing: ProjectsPageProvider;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ProjectsPageProvider>) => Promise<void>;
  isLoading?: boolean;
}

export function ListingEditModal({
  listing,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: ListingEditModalProps) {
  const [formData, setFormData] = useState<Partial<ProjectsPageProvider>>({
    name: listing.name,
    title_or_type: listing.title_or_type,
    description: listing.description,
    optional_location: listing.optional_location,
    response_time: listing.response_time,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: listing.name,
      title_or_type: listing.title_or_type,
      description: listing.description,
      optional_location: listing.optional_location,
      response_time: listing.response_time,
    });
    setError(null);
  }, [listing, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.title_or_type?.trim()) {
        throw new Error('Title/Type is required');
      }
      if (!formData.description?.trim()) {
        throw new Error('Description is required');
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-y-auto max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Listing</h2>
            <p className="text-gray-400 text-sm mt-1">{listing.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">
              {listing.provider_type === 'talent' ? 'Full Name' : 'Company Name'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="Enter name"
            />
          </div>

          {/* Title/Type Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">
              {listing.provider_type === 'talent' ? 'Job Title' : 'Business Type'}
            </label>
            <input
              type="text"
              name="title_or_type"
              value={formData.title_or_type || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., Full-Stack Developer"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={isSaving}
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 resize-none"
              placeholder="Describe your services, experience, and what you offer..."
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Location</label>
            <input
              type="text"
              name="optional_location"
              value={formData.optional_location || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., Kampala, Uganda"
            />
          </div>

          {/* Response Time Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Response Time</label>
            <select
              name="response_time"
              value={formData.response_time || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            >
              <option value="" className="bg-gray-800">Select response time</option>
              <option value="1 hour" className="bg-gray-800">1 hour</option>
              <option value="2 hours" className="bg-gray-800">2 hours</option>
              <option value="4 hours" className="bg-gray-800">4 hours</option>
              <option value="1 day" className="bg-gray-800">1 day</option>
              <option value="2-3 days" className="bg-gray-800">2-3 days</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur border-t border-white/10 p-6 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-6 py-3 text-white bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
