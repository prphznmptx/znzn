import React, { useState, useMemo } from 'react';
import { X, Loader } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { updateEvent, uploadEventImage, updateEventImage } from '../lib/eventServices';
import type { Event } from '../types/events';

interface EditEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  userId: string;
}

const featureOptions = ['Networking', 'Certificates', 'Recording', 'Prizes', 'Refreshments', 'Live Sessions', 'Live Judging', 'Panel Discussion', 'Premium Materials', 'VIP Access', 'Swag Bag'];

export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onEventUpdated,
  userId,
}: EditEventModalProps) {
  const [formData, setFormData] = useState({
    eventName: event.title,
    eventDate: event.event_date,
    eventTime: event.event_time,
    location: event.location,
    description: event.description,
    estimatedGuests: event.capacity,
    budget: event.price || 0,
    organizerSpecification: event.organizer_specification || '',
    attractions: event.attractions?.join(', ') || '',
    features: event.features || [],
    customFeature: '',
    isLivestream: event.is_livestream || false,
    livestreamLink: event.livestream_url || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const imagePreview = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return null;
  }, [imageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName || !formData.eventDate || !formData.location) {
      alert('Please fill required fields');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = event.image_url;

      // Upload image if selected
      if (imageFile) {
        const { url, error: uploadError } = await uploadEventImage(imageFile, event.id);
        if (uploadError) {
          alert(`Image upload failed: ${uploadError}`);
          setIsLoading(false);
          return;
        }
        imageUrl = url;

        // Save image URL to database
        if (imageUrl) {
          const { success, error } = await updateEventImage(event.id, userId, imageUrl, false);
          if (error) {
            alert(`Error saving image: ${error}`);
          }
        }
      }

      // Update event in database
      const { success, error } = await updateEvent(event.id, userId, {
        eventName: formData.eventName,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        location: formData.location,
        description: formData.description,
        estimatedGuests: formData.estimatedGuests,
        budget: formData.budget,
        organizerSpecification: formData.organizerSpecification,
        attractions: formData.attractions,
        features: formData.features,
        isLivestream: formData.isLivestream,
        livestreamLink: formData.livestreamLink,
      });

      if (error) {
        alert(`Error updating event: ${error}`);
        return;
      }

      alert('✓ Event updated successfully!');
      onEventUpdated();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/20 shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 px-8 py-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">Edit Event</h2>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all disabled:opacity-50"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          <ImageUploadField
            value={imageFile}
            preview={imagePreview || event.image_url}
            onChange={setImageFile}
            label="Event Image"
            currentImageUrl={event.image_url}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Date *</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Time</label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Organizer</label>
              <input
                type="text"
                value={formData.organizerSpecification}
                onChange={(e) => setFormData({ ...formData, organizerSpecification: e.target.value })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Guests</label>
              <input
                type="number"
                value={formData.estimatedGuests}
                onChange={(e) => setFormData({ ...formData, estimatedGuests: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Budget (UGX)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Main Speakers/Artistes Featured</label>
              <input
                type="text"
                value={formData.attractions}
                onChange={(e) => setFormData({ ...formData, attractions: e.target.value })}
                placeholder="Comma-separated"
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">Event Features & Perks</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {featureOptions.map(feature => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.features.includes(feature)
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                      : 'glass-effect text-gray-300 hover:text-white'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.customFeature}
                onChange={(e) => setFormData({ ...formData, customFeature: e.target.value })}
                placeholder="Add custom feature..."
                className="flex-1 px-3 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.customFeature.trim()) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, formData.customFeature.trim()],
                      customFeature: ''
                    });
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
              >
                Add
              </button>
            </div>
            {formData.features.length > featureOptions.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.features.slice(featureOptions.length).map((feature, idx) => (
                  <div key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs flex items-center gap-2">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        features: formData.features.filter((_, i) => i !== featureOptions.length + idx)
                      })}
                      className="text-blue-400 hover:text-blue-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isLivestream}
                onChange={(e) => setFormData({ ...formData, isLivestream: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-white font-semibold">Livestream</span>
            </label>
            {formData.isLivestream && (
              <input
                type="url"
                value={formData.livestreamLink}
                onChange={(e) => setFormData({ ...formData, livestreamLink: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
            )}
          </div>

        </form>

      <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 to-slate-900/95 px-8 py-6 border-t border-white/10 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-6 py-3 glass-effect text-gray-300 rounded-xl font-semibold hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          onClick={handleSubmit}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-rose-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </div>
    </div>
  );
}
