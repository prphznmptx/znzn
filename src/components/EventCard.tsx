import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Ticket, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventCreatorMenu from './EventCreatorMenu';
import type { Event } from '../types/events';

interface EventCardProps {
  event: Event;
  nowTime: number;
  calendarAdded: Record<string, boolean>;
  onToggleCalendar: (eventId: string) => void;
  onShare: (event: Event) => void;
  onRegister: (eventId: string) => void;
  onEventUpdated?: () => void;
  onEdit?: (event: Event) => void;
}

function CountdownDisplay({ date, nowTime }: { date: string; nowTime: number }) {
  const target = new Date(date + 'T00:00:00');
  const diff = target.getTime() - nowTime;
  if (diff <= 0) return <span className="text-sm text-rose-400">Happening now</span>;

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className="text-rose-400 text-sm font-mono">
      {days} days, {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

function calculateProgressPercentage(eventDate: string, createdAt: string, nowTime: number): number {
  const created = new Date(createdAt).getTime();
  const eventDateTime = new Date(eventDate + 'T00:00:00').getTime();

  const totalDuration = eventDateTime - created;
  const timeElapsed = nowTime - created;

  if (totalDuration <= 0) return 0;
  if (timeElapsed >= totalDuration) return 100;
  if (timeElapsed < 0) return 0;

  return (timeElapsed / totalDuration) * 100;
}

export default function EventCard({
  event,
  nowTime,
  calendarAdded,
  onToggleCalendar,
  onShare,
  onRegister,
  onEventUpdated,
  onEdit,
}: EventCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const progressPercentage = calculateProgressPercentage(event.event_date, event.created_at, nowTime);

  const handleStreamNow = () => {
    if (!user) {
      alert('Please sign in to access livestream.');
      navigate('/signin');
      return;
    }
    if ((user as any).tier === 'elite' || (user as any).tier === 'premium') {
      alert('Connecting to livestream...');
    } else {
      alert('Livestream is a premium feature. Upgrade to access.');
    }
  };

  return (
    <div className="glass-effect rounded-2xl overflow-hidden hover-lift">
      <div className="relative h-64 md:h-56 lg:h-72 bg-gray-800 flex items-center justify-center overflow-hidden">
        <img src={event.image_url || ''} alt={event.title} className="max-h-full max-w-full object-contain" />
        {event.is_livestream && event.status === 'happening' && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full animate-pulse">
              LIVE
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
            <p className="text-gray-200 text-sm">by {event.organizer_specification || event.organizer_name}</p>
          </div>
          <EventCreatorMenu
            event={event}
            currentUserId={user?.id}
            onEventUpdated={onEventUpdated || (() => {})}
            onEdit={onEdit}
          />
        </div>

        <p className="text-gray-200 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-3 text-gray-200 text-sm">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-gray-200 text-sm">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>{event.event_time ? `${event.event_time} EAT` : 'TBA'}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-200 text-sm">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {event.features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {event.attractions && event.attractions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white text-sm font-medium mb-2">Featuring</h4>
            <div className="text-gray-300 text-sm">{event.attractions.join(', ')}</div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-300">
              {event.status === 'happening' && event.is_livestream ? 'Happening' : 'Happening in'}
            </div>
            <div className="text-sm font-semibold text-white">
              <CountdownDisplay date={event.event_date} nowTime={nowTime} />
            </div>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-purple-600 transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(2, progressPercentage))}%` }}
            />
          </div>
        </div>

        <div>
          {event.status === 'upcoming' ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/signin');
                    return;
                  }
                  onRegister(event.id);
                }}
                className="flex-1 h-12 flex items-center justify-center px-4 font-semibold rounded-lg transition-all bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:shadow-lg"
                title={!user ? 'Sign in to book' : 'Book this event'}
              >
                <Ticket className="w-5 h-5 mr-2 inline" />
                Book Now
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/signin');
                      return;
                    }
                    onToggleCalendar(event.id);
                  }}
                  className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${
                    calendarAdded[event.id]
                      ? 'bg-rose-500 text-white'
                      : 'glass-effect text-gray-300 hover:text-white'
                  }`}
                  title={!user ? 'Sign in to add to calendar' : calendarAdded[event.id] ? 'Added to calendar' : 'Add to calendar'}
                >
                  <Calendar className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/signin');
                      return;
                    }
                    onShare(event);
                  }}
                  className="h-12 w-12 flex items-center justify-center rounded-xl glass-effect text-gray-300 hover:text-white transition-all"
                  title={!user ? 'Sign in to share' : 'Share event'}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : event.status === 'happening' ? (
            <>
              {event.is_livestream ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleStreamNow}
                    className="flex-1 h-12 flex items-center justify-center px-4 font-semibold rounded-lg transition-all bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:shadow-lg animate-pulse"
                  >
                    <Ticket className="w-5 h-5 mr-2 inline" />
                    Stream Now
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (!user) {
                          navigate('/signin');
                          return;
                        }
                        onToggleCalendar(event.id);
                      }}
                      className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${
                        calendarAdded[event.id]
                          ? 'bg-rose-500 text-white'
                          : 'glass-effect text-gray-300 hover:text-white'
                      }`}
                      title={!user ? 'Sign in to add to calendar' : calendarAdded[event.id] ? 'Added to calendar' : 'Add to calendar'}
                    >
                      <Calendar className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => {
                        if (!user) {
                          navigate('/signin');
                          return;
                        }
                        onShare(event);
                      }}
                      className="h-12 w-12 flex items-center justify-center rounded-xl glass-effect text-gray-300 hover:text-white transition-all"
                      title={!user ? 'Sign in to share' : 'Share event'}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button className="w-full py-3 bg-gray-600 text-gray-400 font-semibold rounded-xl cursor-not-allowed">
                  Happening Now
                </button>
              )}
            </>
          ) : (
            <button className="w-full py-3 bg-gray-600 text-gray-400 font-semibold rounded-xl cursor-not-allowed">
              Event Ended
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
