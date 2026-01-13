import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ProjectsPageJob } from '../hooks/useProjectsPageJobs';

interface JobEditModalProps {
  job: ProjectsPageJob;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobId: string, updates: Partial<ProjectsPageJob>) => Promise<void>;
  isLoading?: boolean;
}

export function JobEditModal({
  job,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: JobEditModalProps) {
  const [formData, setFormData] = useState<Partial<ProjectsPageJob>>({
    title: job.title,
    company: job.company,
    description: job.description,
    optional_location: job.optional_location,
    work_location: job.work_location,
    currency: job.currency,
    budget_min: job.budget_min,
    budget_max: job.budget_max,
    skills: job.skills,
    category: job.category,
    job_type: job.job_type,
    application_deadline: job.application_deadline,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    const skillsArray = Array.isArray(job.skills) ? job.skills : [];
    setSkillsInput(skillsArray.join(', '));
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      optional_location: job.optional_location,
      work_location: job.work_location,
      currency: job.currency,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      skills: skillsArray,
      category: job.category,
      job_type: job.job_type,
      application_deadline: job.application_deadline,
    });
    setError(null);
  }, [job, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'budget_min' || name === 'budget_max') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSkillsInput(input);
    const skills = input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setFormData((prev) => ({ ...prev, skills }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Job title is required');
      }
      if (!formData.company?.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.description?.trim()) {
        throw new Error('Description is required');
      }

      await onSave(job.id, formData);
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
            <h2 className="text-2xl font-bold text-white">Edit Job Posting</h2>
            <p className="text-gray-400 text-sm mt-1">{job.title}</p>
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

          {/* Job Title Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., Senior React Developer"
            />
          </div>

          {/* Company Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Company Name *</label>
            <input
              type="text"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., Tech Startup Inc"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={isSaving}
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 resize-none"
              placeholder="Describe the job role, responsibilities, and requirements..."
            />
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium text-sm mb-2">Work Location Type</label>
              <select
                name="work_location"
                value={formData.work_location || 'remote'}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              >
                <option value="remote" className="bg-gray-800">Remote</option>
                <option value="on-site" className="bg-gray-800">On-site</option>
                <option value="hybrid" className="bg-gray-800">Hybrid</option>
                <option value="flexible" className="bg-gray-800">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-medium text-sm mb-2">Specific Location</label>
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
          </div>

          {/* Budget Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-medium text-sm mb-2">Currency</label>
              <select
                name="currency"
                value={formData.currency || 'UGX'}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              >
                <option value="UGX" className="bg-gray-800">UGX</option>
                <option value="USD" className="bg-gray-800">USD</option>
                <option value="EUR" className="bg-gray-800">EUR</option>
                <option value="GBP" className="bg-gray-800">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-medium text-sm mb-2">Min Budget</label>
              <input
                type="number"
                name="budget_min"
                value={formData.budget_min || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-white font-medium text-sm mb-2">Max Budget</label>
              <input
                type="number"
                name="budget_max"
                value={formData.budget_max || ''}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Job Type</label>
            <select
              name="job_type"
              value={formData.job_type || 'gig'}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            >
              <option value="gig" className="bg-gray-800">Gig</option>
              <option value="full-time" className="bg-gray-800">Full-Time</option>
              <option value="part-time" className="bg-gray-800">Part-Time</option>
              <option value="contract" className="bg-gray-800">Contract</option>
            </select>
          </div>

          {/* Skills Field */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Required Skills (comma-separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={handleSkillsChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., React, TypeScript, Node.js, Graphic Design"
            />
            <p className="text-gray-400 text-xs mt-2">Separate multiple skills with commas. Example: PHP, Web Design, Marketing Strategy</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="e.g., digital-marketing"
            />
          </div>

          {/* Application Deadline */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Application Deadline</label>
            <input
              type="date"
              name="application_deadline"
              value={formData.application_deadline?.split('T')[0] || ''}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
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
