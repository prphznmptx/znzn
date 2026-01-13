import React, { useState, useEffect } from 'react';
import { Search, Filter, Radio, Zap, Users, Clock, MapPin, Share2, Heart, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPublishedEvents } from '../lib/eventServices';
import type { Event } from '../types/events';

interface LivestreamTabProps {
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
}

export default function LivestreamTab({
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
}: LivestreamTabProps) {
  const { user } = useAuth();
  const [userLiked, setUserLiked] = useState<Set<string>>(new Set());
  const [viewingLivestream, setViewingLivestream] = useState<string | null>(null);
  const [livestreams, setLivestreams] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['all', 'social', 'business', 'workshop', 'conference'];

  useEffect(() => {
    loadLivestreams();
  }, []);

  const loadLivestreams = async () => {
    setIsLoading(true);
    try {
      const events = await getPublishedEvents();
      // Filter for livestream events that are happening
      const liveEvents = events.filter(event => event.is_livestream && event.status === 'happening');
      setLivestreams(liveEvents);
    } catch (err) {
      console.error('Error loading livestreams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLivestreams = livestreams.filter((event) => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleLike = (eventId: string) => {
    setUserLiked((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleWatchLive = (event: Event) => {
    if (!user) {
      alert('Please sign in to watch livestreams.');
      return;
    }
    setViewingLivestream(event.id);
  };

  if (viewingLivestream) {
    const stream = livestreams.find((e) => e.id === viewingLivestream);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewingLivestream(null)}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
        >
          ← Back to Livestreams
        </button>

        <div className="glass-effect rounded-2xl overflow-hidden">
          <div className="aspect-video bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center">
                <div className="inline-block p-4 bg-red-500/20 rounded-full mb-4">
                  <Radio className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-white text-xl font-semibold">{stream?.title}</h3>
                <p className="text-gray-400 text-sm mt-2">Stream player would load here</p>
                <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{stream?.attendees_count} watching</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span>LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{stream?.title}</h2>
              <p className="text-gray-300 mb-4">{stream?.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-rose-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-400 text-sm">Time</p>
                    <p className="text-white font-medium">{stream?.event_time ? `${stream.event_time} EAT` : 'TBA'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white font-medium">{stream?.location}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {stream?.features.map((feature, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full">
                    {feature}
                  </span>
                ))}
              </div>

              {stream?.speakers && stream.speakers.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Featured Speakers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stream.speakers.map((speaker, idx) => (
                      <div key={idx} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{speaker}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-semibold mb-4">Live Chat</h3>
              <div className="bg-white/5 rounded-lg p-4 h-64 overflow-y-auto mb-4 text-center text-gray-400 text-sm">
                <p>Interactive chat will connect when stream starts</p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Share your thoughts..."
                  className="flex-1 px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect p-6 rounded-2xl border-l-4 border-red-500">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Radio className="w-6 h-6 text-red-500 animate-pulse" />
              <h3 className="text-white font-bold text-lg">Live Now</h3>
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                {filteredLivestreams.length} LIVE
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              Watch events streaming live. Premium and Elite members get exclusive access to all livestreams with interactive chat and HD quality.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search livestreams..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Filter className="text-gray-400 w-5 h-5 hidden md:block" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all text-sm md:text-base"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-800">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 glass-effect rounded-2xl">
          <Loader className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading livestreams...</p>
        </div>
      ) : filteredLivestreams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLivestreams.map((event) => (
            <div key={event.id} className="glass-effect rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden group">
                <img
                  src={event.image_url || ''}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleWatchLive(event)}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold flex items-center space-x-2 transition-all transform -translate-y-2 group-hover:translate-y-0"
                  >
                    <Radio className="w-5 h-5" />
                    <span>Watch Live</span>
                  </button>
                </div>

                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/70 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-4 text-xs text-white">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.attendees_count} watching</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 hover:text-rose-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{event.organizer_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {event.features.slice(0, 2).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {event.features.length > 2 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      +{event.features.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-3">
                    <span>⭐ {event.rating.toFixed(1)}</span>
                    <span>({event.reviews_count} reviews)</span>
                  </div>
                  {event.price > 0 && <span className="text-white font-semibold">UGX {event.price.toLocaleString()}</span>}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleWatchLive(event)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                  >
                    Watch Now
                  </button>
                  <button
                    onClick={() => handleToggleLike(event.id)}
                    className={`p-2 rounded-lg transition-all ${
                      userLiked.has(event.id)
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'glass-effect text-gray-400 hover:text-rose-400'
                    }`}
                    title="Add to favorites"
                  >
                    <Heart className="w-4 h-4" fill={userLiked.has(event.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="p-2 glass-effect text-gray-400 hover:text-white rounded-lg transition-all"
                    title="Share livestream"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-effect rounded-2xl">
          <Radio className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Live Events Right Now</h3>
          <p className="text-gray-400 mb-6">Check back soon for upcoming livestreams or browse upcoming events.</p>
          <button
            onClick={() => onCategoryChange('all')}
            className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all inline-block"
          >
            View Upcoming Events
          </button>
        </div>
      )}
    </div>
  );
}
