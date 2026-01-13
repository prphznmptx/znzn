import React from 'react';
import { Calendar, Clock, MapPin, Share2, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Event } from '../types/events';

interface MyEventCardProps {
  event: Event;
  isLoading: boolean;
  onPublish: (eventId: string) => void;
  onEdit: (event: Event) => void;
  onAddServices: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export default function MyEventCard({
  event,
  isLoading,
  onPublish,
  onEdit,
  onAddServices,
  onDelete,
}: MyEventCardProps) {
  const handleDelete = () => {
    if (confirm('Remove this event from My Events? (It will remain in the database)')) {
      onDelete(event.id);
    }
  };

  return (
    <div className="glass-effect rounded-2xl overflow-hidden hover:bg-white/5 transition-all flex flex-col h-full">
      <div className="relative h-48 bg-gray-800 flex items-center justify-center overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-500/20 to-purple-600/20 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-500 opacity-50" />
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
          {event.organizer_specification && (
            <p className="text-sm text-purple-300">by {event.organizer_specification}</p>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>{new Date(event.event_date).toLocaleDateString()}</span>
          </div>
          {event.event_time && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <span>{event.event_time}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{event.location}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-300 text-sm line-clamp-2">{event.description}</p>
        )}

        {event.attractions && event.attractions.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Main Attractions</p>
            <p className="text-sm text-gray-300">{event.attractions.join(', ')}</p>
          </div>
        )}

        {event.features && event.features.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Features</p>
            <div className="flex flex-wrap gap-2">
              {event.features.map(feature => (
                <span key={feature} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.is_livestream && (
          <div className="flex items-center space-x-2 p-2 bg-blue-500/10 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-300">Livestream enabled</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">Guests</p>
            <p className="text-lg font-bold text-white">{event.capacity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className="text-lg font-bold text-white">
              {event.is_published ? (
                <span className="text-green-400">Published</span>
              ) : (
                <span className="text-yellow-400">Draft</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!event.is_published && (
            <button
              onClick={() => onPublish(event.id)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50 min-w-max"
            >
              <Share2 className="w-4 h-4" />
              <span>Publish</span>
            </button>
          )}
          <button
            onClick={() => onEdit(event)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm flex items-center justify-center space-x-2 min-w-max"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onAddServices(event.id)}
            className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm min-w-max"
          >
            Add Services
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 glass-effect text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-sm disabled:opacity-50 rounded-lg"
            title="Remove from My Events (keeps in database)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
