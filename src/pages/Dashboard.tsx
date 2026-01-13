import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, TrendingUp, Users, Star, Calendar, Briefcase, Play, Award, ArrowRight, Check } from 'lucide-react';
import { useAuth, TIER_POINTS } from '../context/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { useUserActivity } from '../hooks/useUserActivity';
import { useChallenges } from '../hooks/useChallenges';
import { useUpcomingEvents } from '../hooks/useUpcomingEvents';
import { useReferralCode } from '../hooks/useReferralCode';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, changes, loading: statsLoading } = useUserStats();
  const { activities, loading: activitiesLoading } = useUserActivity(4);
  const { challenges, loading: challengesLoading } = useChallenges();
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(3);
  const { referralCode, copyToClipboard } = useReferralCode();
  const [copySuccess, setCopySuccess] = React.useState(false);

  const getNextTier = () => {
    if (!user) return null;
    if (user.tier === 'free') return 'premium';
    if (user.tier === 'premium') return 'professional';
    if (user.tier === 'professional') return 'elite';
    return null;
  };

  const nextTier = getNextTier();
  const pointsNeeded = nextTier ? TIER_POINTS[nextTier as keyof typeof TIER_POINTS] - (stats?.loyalty_points || 0) : 0;

  const formatChange = (value: number) => {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const quickStats = [
    {
      label: 'Portfolio Views',
      value: stats?.portfolio_views?.toLocaleString() || '0',
      icon: <TrendingUp className="w-5 h-5" />,
      change: formatChange(changes?.portfolio_views_change || 0),
      changeColor: getChangeColor(changes?.portfolio_views_change || 0),
      loading: statsLoading
    },
    {
      label: 'Followers',
      value: stats?.followers?.toLocaleString() || '0',
      icon: <Users className="w-5 h-5" />,
      change: formatChange(changes?.followers_change || 0),
      changeColor: getChangeColor(changes?.followers_change || 0),
      loading: statsLoading
    },
    {
      label: 'Rating',
      value: stats?.rating?.toFixed(1) || '0.0',
      icon: <Star className="w-5 h-5" />,
      change: formatChange(Math.round((changes?.rating_change || 0) * 10) / 10),
      changeColor: getChangeColor(changes?.rating_change || 0),
      loading: statsLoading
    },
    {
      label: 'Loyalty Points',
      value: stats?.loyalty_points?.toLocaleString() || '0',
      icon: <Crown className="w-5 h-5" />,
      change: formatChange(changes?.loyalty_points_change || 0),
      changeColor: getChangeColor(changes?.loyalty_points_change || 0),
      loading: statsLoading
    }
  ];

  const formatActivityTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-gray-300">Here's what's happening with your talent profile today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="glass-effect p-6 rounded-xl hover-lift">
              <div className="flex items-center justify-between mb-2">
                <div className="text-rose-400">
                  {stat.icon}
                </div>
                <span className={`${stat.changeColor} text-sm font-medium`}>{stat.change}</span>
              </div>
              {stat.loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-700 rounded mb-1 w-16"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Update Portfolio', icon: <Star className="w-5 h-5" />, to: '/portfolio' },
                  { label: 'Add Content', icon: <Play className="w-5 h-5" />, to: '/content' },
                  { label: 'Join Masterclass', icon: <Award className="w-5 h-5" />, to: '/masterclass' },
                  { label: 'Browse Projects', icon: <Briefcase className="w-5 h-5" />, to: '/projects' }
                ].map((action, index) => (
                  <Link
                    key={index}
                    to={action.to}
                    className="p-4 glass-effect rounded-lg hover:bg-white/10 transition-all text-center group"
                  >
                    <div className="text-rose-400 mb-2 flex justify-center group-hover:scale-110 transition-transform">
                      {action.icon}
                    </div>
                    <div className="text-white text-sm font-medium">{action.label}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                      <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.action_type === 'update' ? 'bg-blue-400' :
                        activity.action_type === 'follower' ? 'bg-green-400' :
                        activity.action_type === 'approval' ? 'bg-yellow-400' : 'bg-purple-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-white text-sm">{activity.action}</div>
                        <div className="text-gray-400 text-xs">{formatActivityTime(activity.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No recent activity yet. Start exploring!</p>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
                <Link to="/events" className="text-rose-400 hover:text-rose-300 transition-colors">
                  View All
                </Link>
              </div>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-3">
                      <div className="w-5 h-5 bg-gray-700 rounded"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.event_date);
                    const dateString = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <div key={event.id} className="flex items-center space-x-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                        <Calendar className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-white font-medium">{event.title}</div>
                          <div className="text-gray-400 text-sm">{dateString} • {event.attendees_count} attending</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No upcoming events at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Status */}
            <div className="glass-effect p-6 rounded-xl">
              <div className="text-center mb-4">
                <Crown className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white capitalize">{user?.tier} Member</h3>
                <p className="text-gray-400 text-sm">Since {user?.joined_date ? new Date(user.joined_date).toLocaleDateString() : 'recently'}</p>
              </div>

              {statsLoading ? (
                <div className="mt-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-10 bg-gray-700 rounded"></div>
                </div>
              ) : user?.tier === 'free' && stats ? (
                <div className="mt-4">
                  <div className="text-center text-sm text-gray-300 mb-2">
                    You are {Math.max(0, pointsNeeded)} points away from {nextTier}!
                  </div>
                  <button className="w-full py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all">
                    Upgrade to Premium
                  </button>
                </div>
              ) : null}
            </div>

            {/* Challenges */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Active Challenges</h3>
              {challengesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-700 rounded w-12"></div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : challenges && challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div key={challenge.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">{challenge.title}</span>
                        <span className="text-gray-400">{challenge.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-rose-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">Reward: {challenge.reward}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No active challenges. Check back soon!</p>
                </div>
              )}
            </div>

            {/* Referral */}
            <div className="glass-effect p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Invite Friends</h3>
              <p className="text-gray-400 text-sm mb-4">
                Earn 100 loyalty points for each friend who joins!
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={referralCode || 'Loading...'}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                />
                <button
                  onClick={async () => {
                    if (referralCode) {
                      const success = await copyToClipboard(referralCode);
                      if (success) {
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2 ${
                    copySuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
