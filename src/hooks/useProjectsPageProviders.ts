import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadToB2 } from '../lib/b2Upload';

export interface ProjectsPageProvider {
  id: string;
  user_id: string;
  provider_type: 'talent' | 'team' | 'agency';
  name: string;
  title_or_type: string;
  category: string;
  avatar_url: string | null;
  description: string | null;
  work_location: 'remote' | 'on-site' | 'hybrid' | 'flexible';
  optional_location: string | null;
  services: Array<{ name: string; price: number }> | string[];
  starting_rate?: number;
  team_size?: number;
  rating: number;
  reviews_count: number;
  completed_projects: number;
  response_time: string;
  status: 'draft' | 'published' | 'archived';
  portfolio_connected?: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjectsPageProviders() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProjectsPageProvider[]>([]);
  const [userProviders, setUserProviders] = useState<ProjectsPageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store pending avatar files for each provider (providerId -> File)
  const pendingAvatarsRef = useRef<Record<string, File>>({});

  // Fetch all published providers
  const fetchAllProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('projects_page_providers')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setProviders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's own providers
  const fetchUserProviders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: err } = await supabase
        .from('projects_page_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUserProviders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your providers');
    }
  }, [user?.id]);

  // Create new provider
  const createProvider = useCallback(
    async (provider: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        // Avatar URL is now uploaded before calling this function
        // Just save the provider with avatar_url to database
        const { avatar_file, ...providerData } = provider;

        const { data, error: err } = await supabase
          .from('projects_page_providers')
          .insert([
            {
              user_id: user.id,
              ...providerData,
            },
          ])
          .select()
          .single();

        if (err) throw err;

        // Update local state
        setUserProviders((prev) => [data, ...prev]);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create provider';
        setError(message);
        throw err;
      }
    },
    [user?.id]
  );

  // Update provider
  const updateProvider = useCallback(
    async (id: string, updates: Partial<ProjectsPageProvider>) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const { data, error: err } = await supabase
          .from('projects_page_providers')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (err) throw err;

        // Update local state
        setUserProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update provider';
        setError(message);
        throw err;
      }
    },
    [user?.id]
  );

  // Delete provider
  const deleteProvider = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const { error: err } = await supabase
          .from('projects_page_providers')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (err) throw err;

        // Update local state
        setUserProviders((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete provider';
        setError(message);
        throw err;
      }
    },
    [user?.id]
  );

  // Publish provider (upload avatar if pending, then change status to published)
  const publishProvider = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const avatarFile = pendingAvatarsRef.current[id];
        let avatarUrl: string | null = null;

        // Upload avatar to B2 if there's a pending file
        if (avatarFile && avatarFile instanceof File) {
          const { publicUrl, error: uploadError } = await uploadToB2(
            avatarFile,
            `projects_page_avatars/${user.id}`
          );

          if (uploadError) throw uploadError;
          avatarUrl = publicUrl;

          // Remove from pending after successful upload
          delete pendingAvatarsRef.current[id];
        }

        // Update provider with avatar URL and published status
        const updates: any = { status: 'published' };
        if (avatarUrl) {
          updates.avatar_url = avatarUrl;
        }

        return updateProvider(id, updates);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to publish provider';
        setError(message);
        throw err;
      }
    },
    [user?.id, updateProvider]
  );

  // Get pending avatar preview for a provider
  const getPendingAvatarFile = useCallback((id: string): File | null => {
    return pendingAvatarsRef.current[id] || null;
  }, []);

  useEffect(() => {
    fetchAllProviders();
    if (user?.id) {
      fetchUserProviders();
    }
  }, [user?.id, fetchAllProviders, fetchUserProviders]);

  return {
    providers,
    userProviders,
    loading,
    error,
    fetchAllProviders,
    fetchUserProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    publishProvider,
    getPendingAvatarFile,
  };
}
