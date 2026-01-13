import React, { useEffect, useState } from 'react';
import { Link2, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface PortfolioConnectionToggleProps {
  isConnected: boolean;
  onToggle: (connected: boolean, profileData?: { name: string; avatar_url: string | null }) => void;
  providerType: 'talent' | 'team' | 'agency';
}

export default function PortfolioConnectionToggle({
  isConnected,
  onToggle,
  providerType,
}: PortfolioConnectionToggleProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      if (err) throw err;

      if (data) {
        setPortfolioData(data);
        onToggle(true, data);
      } else {
        setError('Could not fetch portfolio data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect portfolio');
      onToggle(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isConnected) {
      onToggle(false);
    } else {
      await fetchPortfolioData();
    }
  };

  const getFieldLabel = () => {
    if (providerType === 'talent') return 'Full Name & Display Picture';
    if (providerType === 'team') return 'Team Name & Logo';
    return 'Agency Name & Logo';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isConnected ? 'bg-gradient-to-r from-rose-500 to-purple-600' : 'bg-gray-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isConnected ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-gray-300">
                Connect to Portfolio
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-fill {getFieldLabel()} from your Portfolio
            </p>
          </div>
          {loading && <Loader className="w-4 h-4 text-rose-400 animate-spin" />}
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {isConnected && portfolioData && (
        <div className="p-3 bg-gradient-to-r from-rose-500/10 to-purple-600/10 border border-rose-400/30 rounded-lg">
          <p className="text-xs font-medium text-rose-300">
            ✓ Connected to: {portfolioData.name}
          </p>
          <p className="text-xs text-rose-200/70 mt-1">
            Fields will be synced from your Portfolio profile
          </p>
        </div>
      )}
    </div>
  );
}
