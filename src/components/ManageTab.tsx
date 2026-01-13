import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Star, MessageSquare, CheckCircle, Clock, AlertCircle, Briefcase } from 'lucide-react';

interface HiredService {
  id: string;
  provider_name: string;
  provider_type: 'talent' | 'team' | 'agency';
  service_name: string;
  status: 'in_progress' | 'completed' | 'on_hold';
  hired_date: string;
  completion_date?: string;
  rating?: number;
  review?: string;
  can_rate: boolean;
}

interface RatingSubmission {
  rating: number;
  comment: string;
}

export default function ManageTab() {
  const { user } = useAuth();
  const [hiredServices, setHiredServices] = useState<HiredService[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingingId, setRatingingId] = useState<string | null>(null);
  const [ratingSubmission, setRatingSubmission] = useState<RatingSubmission>({
    rating: 5,
    comment: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchHiredServices();
    }
  }, [user?.id]);

  const fetchHiredServices = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('event_service_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const services: HiredService[] = (data || []).map((booking: any) => ({
        id: booking.id,
        provider_name: booking.provider_name,
        provider_type: booking.provider_category as 'talent' | 'team' | 'agency',
        service_name: booking.provider_name,
        status: booking.booking_status,
        hired_date: booking.created_at,
        completion_date: booking.updated_at,
        rating: null,
        review: null,
        can_rate: booking.booking_status === 'completed',
      }));

      setHiredServices(services);
    } catch (err) {
      console.error('Error fetching hired services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (serviceId: string) => {
    if (!user?.id) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const service = hiredServices.find((s) => s.id === serviceId);
      if (!service) return;

      const { error } = await supabase
        .from('project_ratings')
        .insert([
          {
            rater_id: user.id,
            target_id: serviceId,
            target_type: service.provider_type,
            target_name: service.provider_name,
            rating: ratingSubmission.rating,
            comment: ratingSubmission.comment || null,
          },
        ]);

      if (error) throw error;

      setSubmitSuccess('Rating submitted successfully!');
      setHiredServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                rating: ratingSubmission.rating,
                review: ratingSubmission.comment,
              }
            : s
        )
      );
      setRatingingId(null);
      setRatingSubmission({ rating: 5, comment: '' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'on_hold':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'on_hold':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-400"></div>
      </div>
    );
  }

  if (hiredServices.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-white mb-2">No hired services yet</h3>
        <p className="text-gray-400">When you hire talents, teams, or agencies, manage them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hiredServices.map((service) => (
        <div key={service.id} className="glass-effect rounded-2xl overflow-hidden p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-white">{service.provider_name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                  <span className="capitalize">{service.status.replace('_', ' ')}</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Service: <span className="text-gray-300">{service.service_name}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Hired on: <span className="text-gray-300">{new Date(service.hired_date).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {service.can_rate && !service.rating && ratingingId !== service.id && (
            <button
              onClick={() => setRatingingId(service.id)}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <Star className="w-4 h-4 inline mr-2" />
              Rate this service
            </button>
          )}

          {ratingingId === service.id && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
              <h4 className="text-white font-semibold mb-4">Rate your experience</h4>

              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingSubmission({ ...ratingSubmission, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingSubmission.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">Comment (optional)</label>
                <textarea
                  value={ratingSubmission.comment}
                  onChange={(e) =>
                    setRatingSubmission({ ...ratingSubmission, comment: e.target.value })
                  }
                  placeholder="Share your experience with this service..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  rows={3}
                />
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
                  {submitError}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleRatingSubmit(service.id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Submit Rating
                </button>
                <button
                  onClick={() => {
                    setRatingingId(null);
                    setRatingSubmission({ rating: 5, comment: '' });
                  }}
                  className="flex-1 px-4 py-2 glass-effect text-gray-300 hover:text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {service.rating && (
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < service.rating!
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-medium">{service.rating}/5</span>
              </div>
              {service.review && (
                <p className="text-gray-300 text-sm">{service.review}</p>
              )}
            </div>
          )}

          {submitSuccess && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-sm">
              {submitSuccess}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
