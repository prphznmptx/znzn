import React, { useState } from 'react';
import { AlertCircle, Trash2, Calendar } from 'lucide-react';

interface ImprovedAddJobFormProps {
  onCreate: (job: any) => void;
  isLoading?: boolean;
  category?: string;
  providerType?: 'talent' | 'team' | 'agency';
}

export default function ImprovedAddJobForm({
  onCreate,
  isLoading = false,
  category = 'digital-marketing',
  providerType = 'talent',
}: ImprovedAddJobFormProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [workLocation, setWorkLocation] = useState('remote');
  const [optionalLocation, setOptionalLocation] = useState('');
  const [currency, setCurrency] = useState('UGX');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});


  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Job title is required';
    if (!company.trim()) errors.company = 'Company name is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (skills.length === 0) errors.skills = 'Add at least one skill';

    const minVal = budgetMin ? Number(budgetMin) : 0;
    const maxVal = budgetMax ? Number(budgetMax) : 0;

    if (minVal < 0) errors.budgetMin = 'Budget must be 0 or greater';
    if (maxVal > 0 && maxVal < minVal) {
      errors.budgetMax = 'Max budget must be greater than or equal to min budget';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 15) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    const minVal = budgetMin ? Number(budgetMin) : null;
    const maxVal = budgetMax ? Number(budgetMax) : null;

    const job = {
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      work_location: workLocation,
      optional_location: optionalLocation.trim() || null,
      currency,
      budget_min: minVal,
      budget_max: maxVal,
      skills,
      job_type: jobType,
      category,
      provider_type: providerType,
      application_deadline: applicationDeadline || null,
      status: 'draft', // Default to draft; parent can override to 'published'
    };

    try {
      await onCreate(job);
      // Reset form
      setTitle('');
      setCompany('');
      setDescription('');
      setWorkLocation('remote');
      setOptionalLocation('');
      setCurrency('UGX');
      setBudgetMin('');
      setBudgetMax('');
      setSkills([]);
      setSkillInput('');
      setJobType('full-time');
      setApplicationDeadline('');
      setValidationErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job posting');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Job Title & Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors.title) {
                setValidationErrors({ ...validationErrors, title: '' });
              }
            }}
            placeholder="e.g., Lead Graphic Designer"
            className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
              validationErrors.title ? 'border-red-500/50' : 'border-white/20'
            }`}
          />
          {validationErrors.title && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Company / Brand</label>
          <input
            type="text"
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              if (validationErrors.company) {
                setValidationErrors({ ...validationErrors, company: '' });
              }
            }}
            placeholder="e.g., ABC Company Ltd."
            className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
              validationErrors.company ? 'border-red-500/50' : 'border-white/20'
            }`}
          />
          {validationErrors.company && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.company}</p>
          )}
        </div>
      </div>

      {/* Job Type & Work Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          >
            <option value="contract" className="bg-gray-800">Contract</option>
            <option value="full-time" className="bg-gray-800">Full-time</option>
            <option value="part-time" className="bg-gray-800">Part-time</option>
            <option value="gig" className="bg-gray-800">Gig</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Work Location</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['remote', 'on-site', 'hybrid', 'flexible'] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setWorkLocation(loc)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  workLocation === loc
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                    : 'glass-effect text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                {loc.charAt(0).toUpperCase() + loc.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Location */}
      {(workLocation === 'on-site' || workLocation === 'hybrid') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
          <input
            type="text"
            value={optionalLocation}
            onChange={(e) => setOptionalLocation(e.target.value)}
            placeholder="e.g., Kampala, Uganda"
            className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Budget Range</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => {
                setBudgetMin(e.target.value);
                if (validationErrors.budgetMin) {
                  setValidationErrors({ ...validationErrors, budgetMin: '' });
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Min"
              className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
                validationErrors.budgetMin ? 'border-red-500/50' : 'border-white/20'
              }`}
            />
            {validationErrors.budgetMin && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.budgetMin}</p>
            )}
          </div>

          <span className="text-gray-400">—</span>

          <div className="flex-1">
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => {
                setBudgetMax(e.target.value);
                if (validationErrors.budgetMax) {
                  setValidationErrors({ ...validationErrors, budgetMax: '' });
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Max"
              className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
                validationErrors.budgetMax ? 'border-red-500/50' : 'border-white/20'
              }`}
            />
            {validationErrors.budgetMax && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.budgetMax}</p>
            )}
          </div>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          >
            <option value="UGX" className="bg-gray-800">UGX</option>
            <option value="USD" className="bg-gray-800">USD</option>
            <option value="EUR" className="bg-gray-800">EUR</option>
            <option value="GBP" className="bg-gray-800">GBP</option>
          </select>
        </div>
      </div>

      {/* Application Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Application Deadline</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="datetime-local"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">Optional: Set when applications should close</p>
      </div>

      {/* Required Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="e.g., Adobe Creative Suite"
            className="flex-1 px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={!skillInput.trim() || skills.length >= 15}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Add
          </button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-400/50 rounded-lg"
              >
                <span className="text-sm text-purple-300">{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {validationErrors.skills && (
          <p className="mt-2 text-xs text-red-400">{validationErrors.skills}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">{skills.length} / 15 skills added</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (validationErrors.description) {
              setValidationErrors({ ...validationErrors, description: '' });
            }
          }}
          placeholder="Describe the job details, requirements, responsibilities, and what you're looking for in a candidate..."
          className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none h-32 ${
            validationErrors.description ? 'border-red-500/50' : 'border-white/20'
          }`}
        />
        {validationErrors.description && (
          <p className="mt-1 text-xs text-red-400">{validationErrors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{description.length} / 1000 characters</p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
