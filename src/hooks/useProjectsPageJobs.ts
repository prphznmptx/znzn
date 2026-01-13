import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface ProjectsPageJob {
  id: string;
  user_id: string;
  title: string;
  company: string;
  description: string | null;
  work_location: 'remote' | 'on-site' | 'hybrid' | 'flexible';
  optional_location: string | null;
  currency: string;
  budget_min: number | null;
  budget_max: number | null;
  skills: string[];
  category: string | null;
  provider_type?: 'talent' | 'team' | 'agency';
  job_type: 'gig' | 'full-time' | 'part-time' | 'contract';
  application_deadline: string | null;
  status: 'draft' | 'published' | 'closed' | 'archived';
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export function useProjectsPageJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ProjectsPageJob[]>([]);
  const [userJobs, setUserJobs] = useState<ProjectsPageJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all published jobs
  const fetchAllJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('projects_page_jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's own jobs
  const fetchUserJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: err } = await supabase
        .from('projects_page_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUserJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your jobs');
    }
  }, [user?.id]);

  // Create new job posting
  const createJob = useCallback(
    async (job: Omit<ProjectsPageJob, 'id' | 'user_id' | 'applications_count' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const { data, error: err } = await supabase
          .from('projects_page_jobs')
          .insert([
            {
              user_id: user.id,
              applications_count: 0,
              ...job,
            },
          ])
          .select()
          .single();

        if (err) throw err;

        // Update local state
        setUserJobs((prev) => [data, ...prev]);

        // If the job is being published, refetch all jobs to update the Apply tab
        if (job.status === 'published') {
          await fetchAllJobs();
        }

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create job posting';
        setError(message);
        throw err;
      }
    },
    [user?.id, fetchAllJobs]
  );

  // Update job posting
  const updateJob = useCallback(
    async (id: string, updates: Partial<ProjectsPageJob>) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const { data, error: err } = await supabase
          .from('projects_page_jobs')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (err) throw err;

        // Update local state
        setUserJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
        );

        // If job is published, update the all jobs list as well
        if (updates.status === 'published' || data.status === 'published') {
          setJobs((prev) =>
            prev.map((j) => (j.id === id ? data : j))
          );
        } else {
          // Remove from published jobs if status changed from published
          setJobs((prev) => prev.filter((j) => j.id !== id));
        }

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update job posting';
        setError(message);
        throw err;
      }
    },
    [user?.id]
  );

  // Delete job posting
  const deleteJob = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const { error: err } = await supabase
          .from('projects_page_jobs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (err) throw err;

        // Update local state
        setUserJobs((prev) => prev.filter((j) => j.id !== id));

        // Remove from all jobs list as well
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete job posting';
        setError(message);
        throw err;
      }
    },
    [user?.id]
  );

  // Publish job (change status to published)
  const publishJob = useCallback(
    async (id: string) => {
      const result = await updateJob(id, { status: 'published' });
      // Refetch all jobs to update the Apply tab with the newly published job
      await fetchAllJobs();
      return result;
    },
    [updateJob, fetchAllJobs]
  );

  // Close job (change status to closed)
  const closeJob = useCallback(
    async (id: string) => {
      return updateJob(id, { status: 'closed' });
    },
    [updateJob]
  );

  useEffect(() => {
    fetchAllJobs();
    if (user?.id) {
      fetchUserJobs();
    }
  }, [user?.id, fetchAllJobs, fetchUserJobs]);

  return {
    jobs,
    userJobs,
    loading,
    error,
    fetchAllJobs,
    fetchUserJobs,
    createJob,
    updateJob,
    deleteJob,
    publishJob,
    closeJob,
  };
}
