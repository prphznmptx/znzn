import React, { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import ProjectsPageAvatarUpload from './ProjectsPageAvatarUpload';
import PortfolioConnectionToggle from './PortfolioConnectionToggle';
import { professionalTitlesByCategory, businessTypesByCategory, currencies } from './ProfessionalTitlesData';
import { servicesByTitle, servicesByBusinessType, serviceMenuByService } from './ServicesAndMenuData';
import { uploadToB2 } from '../lib/b2Upload';
import { useAuth } from '../context/AuthContext';

interface ImprovedAddProviderFormProps {
  onCreate: (provider: any, kind: 'talent' | 'team' | 'agency') => void;
  isLoading?: boolean;
  category?: string;
  providerType?: 'talent' | 'team' | 'agency';
}

interface Service {
  name: string;
  serviceMenu: string;
  price: string;
  currency: string;
}

export default function ImprovedAddProviderForm({
  onCreate,
  isLoading = false,
  category = 'digital-marketing',
  providerType = 'talent',
}: ImprovedAddProviderFormProps) {
  const { user } = useAuth();
  const kind = providerType;
  const [name, setName] = useState('');
  const [titleOrType, setTitleOrType] = useState('');
  const [titleOrTypeCustom, setTitleOrTypeCustom] = useState('');
  const [showCustomTitleInput, setShowCustomTitleInput] = useState(false);
  const [workLocation, setWorkLocation] = useState('remote');
  const [optionalLocation, setOptionalLocation] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServiceMenu, setSelectedServiceMenu] = useState('');
  const [serviceCurrency, setServiceCurrency] = useState('UGX');
  const [servicePrice, setServicePrice] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [portfolioConnected, setPortfolioConnected] = useState(false);

  // Get available titles/types for current category
  const availableTitles = kind === 'talent' 
    ? (professionalTitlesByCategory[category] || [])
    : (businessTypesByCategory[category] || []);

  const handlePortfolioToggle = (connected: boolean, profileData?: { name: string; avatar_url: string | null }) => {
    setPortfolioConnected(connected);

    if (connected && profileData) {
      setName(profileData.name || '');
      if (profileData.avatar_url) {
        setAvatarPreview(profileData.avatar_url);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Name is required';
    
    // Check titleOrType - either selected or custom
    if (!titleOrType && !titleOrTypeCustom) {
      errors.titleOrType = kind === 'talent' ? 'Professional Title is required' : 'Business Type/Role is required';
    }
    
    if (!description.trim()) errors.description = 'Description is required';
    if (services.length === 0) errors.services = 'Add at least one service with pricing';

    // Validate services have prices
    const invalidServices = services.filter(s => !s.price || Number(s.price) <= 0);
    if (invalidServices.length > 0) {
      errors.services = 'All services must have a valid price';
    }

    if (kind !== 'talent') {
      if (!teamSize || Number(teamSize) <= 0) {
        errors.teamSize = 'Valid team size is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddService = () => {
    if (!selectedService) {
      setValidationErrors({ ...validationErrors, services: 'Service/Specialty is required' });
      return;
    }

    if (!selectedServiceMenu) {
      setValidationErrors({ ...validationErrors, services: 'Service Menu is required' });
      return;
    }

    if (!servicePrice || Number(servicePrice) <= 0) {
      setValidationErrors({ ...validationErrors, services: 'Valid price is required' });
      return;
    }

    if (services.length < 10) {
      setServices([...services, { name: selectedService, serviceMenu: selectedServiceMenu, price: servicePrice, currency: serviceCurrency }]);
      setSelectedService('');
      setSelectedServiceMenu('');
      setServicePrice('');
      setValidationErrors({ ...validationErrors, services: '' });
    }
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    const finalTitleOrType = titleOrType || titleOrTypeCustom.trim();

    let avatarUrl: string | null = null;

    // Upload avatar to B2 if file is selected
    if (avatarFile && avatarFile instanceof File) {
      try {
        const { publicUrl, error: uploadError } = await uploadToB2(
          avatarFile,
          `projects_page_avatars/${user.id}`
        );

        if (uploadError) {
          setError(uploadError);
          return;
        }

        avatarUrl = publicUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        return;
      }
    }

    const provider: any = {
      name: name.trim(),
      title_or_type: finalTitleOrType,
      work_location: workLocation,
      optional_location: optionalLocation.trim() || null,
      description: description.trim(),
      avatar_url: avatarUrl, // Use uploaded URL instead of file
      services,
      category,
      provider_type: kind,
      status: 'draft',
      portfolio_connected: portfolioConnected,
    };

    if (kind !== 'talent') {
      provider.team_size = Number(teamSize);
    }

    try {
      await onCreate(provider, kind);
      // Reset form
      setName('');
      setTitleOrType('');
      setTitleOrTypeCustom('');
      setShowCustomTitleInput(false);
      setWorkLocation('remote');
      setOptionalLocation('');
      setTeamSize('');
      setDescription('');
      setServices([]);
      setSelectedService('');
      setSelectedServiceMenu('');
      setServiceCurrency('UGX');
      setServicePrice('');
      setAvatarFile(null);
      setAvatarPreview(null);
      setPortfolioConnected(false);
      setValidationErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
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

      {/* Portfolio Connection Toggle */}
      <PortfolioConnectionToggle
        isConnected={portfolioConnected}
        onToggle={handlePortfolioToggle}
        providerType={kind}
      />

      {/* Avatar Upload */}
      <ProjectsPageAvatarUpload
        onFileSelect={(file, preview) => {
          setAvatarFile(file);
          setAvatarPreview(preview);
        }}
        initialPreview={avatarPreview}
        providerType={kind}
        disabled={portfolioConnected}
      />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {kind === 'talent' ? 'Full Name' : 'Business Name'}
          {portfolioConnected && <span className="text-rose-400 text-xs ml-2">(from Portfolio)</span>}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (validationErrors.name) {
              setValidationErrors({ ...validationErrors, name: '' });
            }
          }}
          disabled={portfolioConnected}
          placeholder={kind === 'talent' ? 'John Doe' : 'Creative Studios'}
          className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            validationErrors.name ? 'border-red-500/50' : 'border-white/20'
          }`}
        />
        {validationErrors.name && (
          <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
        )}
      </div>

      {/* Professional Title / Business Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {kind === 'talent' ? 'Professional Title' : 'Business Type/Role'}
        </label>
        
        {/* Preset Options */}
        {availableTitles.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Select or add custom:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {availableTitles.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setTitleOrType(title);
                    setShowCustomTitleInput(false);
                    setTitleOrTypeCustom('');
                    if (validationErrors.titleOrType) {
                      setValidationErrors({ ...validationErrors, titleOrType: '' });
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    titleOrType === title
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                      : 'glass-effect text-gray-300 hover:text-white border border-white/10 hover:border-white/30'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Title Input */}
        {!titleOrType && (
          <div>
            <button
              type="button"
              onClick={() => setShowCustomTitleInput(!showCustomTitleInput)}
              className="text-sm text-rose-400 hover:text-rose-300 mb-2 transition-colors"
            >
              {showCustomTitleInput ? '✕ Cancel custom entry' : '+ Add custom entry'}
            </button>
            
            {showCustomTitleInput && (
              <input
                type="text"
                value={titleOrTypeCustom}
                onChange={(e) => {
                  setTitleOrTypeCustom(e.target.value);
                  if (validationErrors.titleOrType) {
                    setValidationErrors({ ...validationErrors, titleOrType: '' });
                  }
                }}
                placeholder={kind === 'talent' ? 'e.g., Digital Marketer' : 'e.g., Production House'}
                className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
                  validationErrors.titleOrType ? 'border-red-500/50' : 'border-white/20'
                }`}
              />
            )}
          </div>
        )}

        {validationErrors.titleOrType && (
          <p className="mt-1 text-xs text-red-400">{validationErrors.titleOrType}</p>
        )}
      </div>


      {/* Team Size (Teams and Agencies only) */}
      {kind !== 'talent' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
          <input
            type="number"
            value={teamSize}
            onChange={(e) => {
              setTeamSize(e.target.value);
              if (validationErrors.teamSize) {
                setValidationErrors({ ...validationErrors, teamSize: '' });
              }
            }}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="e.g., 5"
            className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
              validationErrors.teamSize ? 'border-red-500/50' : 'border-white/20'
            }`}
          />
          {validationErrors.teamSize && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.teamSize}</p>
          )}
        </div>
      )}

      {/* Services/Specialties and Service Menu */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Services/Specialties
        </label>
        <div className="space-y-3 mb-3">
          {/* Services/Specialties Dropdown */}
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setSelectedServiceMenu('');
              if (validationErrors.services) {
                setValidationErrors({ ...validationErrors, services: '' });
              }
            }}
            className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          >
            <option value="" className="bg-gray-800">Select a service...</option>
            {kind === 'talent'
              ? (servicesByTitle[titleOrType] || servicesByTitle[titleOrTypeCustom] || []).map((service) => (
                  <option key={service} value={service} className="bg-gray-800">
                    {service}
                  </option>
                ))
              : (servicesByBusinessType[titleOrType] || servicesByBusinessType[titleOrTypeCustom] || []).map((service) => (
                  <option key={service} value={service} className="bg-gray-800">
                    {service}
                  </option>
                ))
            }
          </select>

          {/* Service Menu Dropdown */}
          <select
            value={selectedServiceMenu}
            onChange={(e) => {
              setSelectedServiceMenu(e.target.value);
              if (validationErrors.services) {
                setValidationErrors({ ...validationErrors, services: '' });
              }
            }}
            disabled={!selectedService}
            className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" className="bg-gray-800">Select specific service type...</option>
            {(serviceMenuByService[selectedService] || []).map((menu) => (
              <option key={menu} value={menu} className="bg-gray-800">
                {menu}
              </option>
            ))}
          </select>

          {/* Price and Currency */}
          <div className="flex gap-2">
            <select
              value={serviceCurrency}
              onChange={(e) => setServiceCurrency(e.target.value)}
              className="px-3 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr} className="bg-gray-800">
                  {curr}
                </option>
              ))}
            </select>
            <div className="flex-1">
              <input
                type="number"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
                placeholder="Price"
                className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleAddService}
              disabled={!selectedService || !selectedServiceMenu || !servicePrice.trim() || services.length >= 10}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {services.length > 0 && (
          <div className="space-y-2 mb-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{service.name}</p>
                  <p className="text-xs text-rose-300 mt-1">Service Menu: {service.serviceMenu}</p>
                  <p className="text-xs text-rose-300">{service.currency} {Number(service.price).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveService(index)}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {validationErrors.services && (
          <p className="mt-2 text-xs text-red-400">{validationErrors.services}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">{services.length} / 10 services added</p>
      </div>

      {/* Work Location */}
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

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (validationErrors.description) {
              setValidationErrors({ ...validationErrors, description: '' });
            }
          }}
          placeholder="Tell potential clients about your experience, expertise, and what makes you special..."
          className={`w-full px-4 py-3 glass-effect rounded-xl border text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none h-32 ${
            validationErrors.description ? 'border-red-500/50' : 'border-white/20'
          }`}
        />
        {validationErrors.description && (
          <p className="mt-1 text-xs text-red-400">{validationErrors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{description.length} / 500 characters</p>
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
