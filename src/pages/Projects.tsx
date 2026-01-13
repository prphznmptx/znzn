import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Users,
  User,
  Eye,
  Briefcase,
  Building,
  Filter,
  UserPlus,
  Gift,
  Award,
  SlidersHorizontal,
  Plus,
  ShoppingBag,
  BookOpen,
  Calendar,
  Banknote
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImprovedAddProviderForm from '../components/ImprovedAddProviderForm';
import ImprovedAddJobForm from '../components/ImprovedAddJobForm';
import { useProjectsPageProviders, ProjectsPageProvider } from '../hooks/useProjectsPageProviders';
import { useProjectsPageJobs, ProjectsPageJob } from '../hooks/useProjectsPageJobs';
import { ListingOwnerControls } from '../components/ListingOwnerControls';
import { ListingEditModal } from '../components/ListingEditModal';
import { JobEditModal } from '../components/JobEditModal';
import ManageTab from '../components/ManageTab';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize hooks for providers and jobs
  const {
    providers: allProviders,
    loading: providersLoading,
    error: providersError,
    createProvider,
    updateProvider,
    deleteProvider,
  } = useProjectsPageProviders();

  const {
    jobs: allJobs,
    userJobs,
    loading: jobsLoading,
    error: jobsError,
    createJob,
    updateJob,
    deleteJob,
    publishJob,
    closeJob,
  } = useProjectsPageJobs();

  const [activeTab, setActiveTab] = useState<'hire' | 'add' | 'apply' | 'manage' | 'resources' | 'sponsor' | 'recognition'>(
    user?.role === 'creator' ? 'apply' : 'hire'
  );

  const [entityType, setEntityType] = useState<'talents' | 'teams' | 'agencies'>('talents');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAddCategory, setSelectedAddCategory] = useState('digital-marketing');
  const [sortField, setSortField] = useState<'all' | 'price' | 'rating' | 'popularity' | 'reviews'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Determine default view for Add tab based on user role
  const getDefaultAddTab = () => {
    if (!user) return 'services';
    if (user.role === 'creator') return 'services';
    return 'jobs';
  };

  const [addTabView, setAddTabView] = useState<'jobs' | 'services'>(getDefaultAddTab());

  // Edit modal state for providers
  const [editingListing, setEditingListing] = useState<ProjectsPageProvider | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit modal state for jobs
  const [editingJob, setEditingJob] = useState<ProjectsPageJob | null>(null);
  const [isJobEditModalOpen, setIsJobEditModalOpen] = useState(false);

  // Track which database providers have been added to avoid duplicates
  const addedProviderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'add') {
      setAddTabView(getDefaultAddTab());
    }
  }, [activeTab, user]);

  // Sync published providers from database to local state
  useEffect(() => {
    if (allProviders && allProviders.length > 0) {
      const publishedProviders = allProviders.filter((p: any) => p.status === 'published');

      publishedProviders.forEach((provider: any) => {
        // Skip if already added
        if (addedProviderIdsRef.current.has(provider.id)) {
          return;
        }

        const listing = transformProviderToListing(provider, provider.provider_type);

        if (provider.provider_type === 'talent') {
          setTalents(prev => {
            // Check if already exists
            if (prev.find(t => t.id === listing.id)) return prev;
            return [...prev, listing];
          });
        } else if (provider.provider_type === 'team') {
          setTeams(prev => {
            if (prev.find(t => t.id === listing.id)) return prev;
            return [...prev, listing];
          });
        } else if (provider.provider_type === 'agency') {
          setAgencies(prev => {
            if (prev.find(a => a.id === listing.id)) return prev;
            return [...prev, listing];
          });
        }

        addedProviderIdsRef.current.add(provider.id);
      });
    }
  }, [allProviders]);

  const categories = [
    'all',
    'acting',
    'modeling',
    'digital-marketing',
    'event-management',
    'brand-ambassador',
    'content-creation',
    'photography',
    'design',
    'film-video-production',
    'audio-production'
  ];

  const addTabCategories = [
    'digital-marketing',
    'brand-ambassador',
    'media-communications',
    'media-production',
    'art-&-design',
    'modelling',
    'dance-&-choreography',
    'acting',
    'film-video-production',
    'audio-production',
    'music',
    'event-management',
    'photography',
    'design'
  ];

  const hireApplyCategories = [
    'all',
    'digital-marketing',
    'brand-ambassador',
    'media-communications',
    'media-production',
    'art-&-design',
    'modelling',
    'dance-&-choreography',
    'acting',
    'film-video-production',
    'audio-production',
    'music',
    'event-management',
    'photography',
    'design'
  ];

  const resourcesCategories = [
    'all',
    'templates',
    'books',
    'scripts',
    'lyrics',
    'software',
    'presets',
    'guidance'
  ];

  function maskNumber(n: number): string {
    const digits = String(Math.max(1, Math.abs(Math.trunc(n)))).length;
    return '-'.repeat(digits);
  }

  function maskRating(r: number): string {
    return '-'.repeat((Number.isFinite(r) ? r : 0).toFixed(1).length);
  }

  // Use jobs from Supabase instead of hardcoded local data
  const projects = allJobs.filter(job => job.status === 'published').map(job => {
    let budget = '';
    if (job.budget_max && job.budget_min) {
      budget = `${job.currency} ${Number(job.budget_min).toLocaleString()}-${Number(job.budget_max).toLocaleString()}`;
    } else if (job.budget_max) {
      budget = `${job.currency} ${Number(job.budget_max).toLocaleString()}`;
    } else if (job.budget_min) {
      budget = `${job.currency} ${Number(job.budget_min).toLocaleString()}`;
    }

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.optional_location || (job.work_location === 'remote' ? 'Remote' : job.work_location),
      budget,
      description: job.description,
      skills: Array.isArray(job.skills) ? job.skills : [],
      type: job.category || job.job_type,
      category: job.category,
      jobType: job.job_type,
      providerType: job.provider_type || 'talent',
      userId: job.user_id,
      jobId: job.id
    };
  });

  const [resources, setResources] = useState<any[]>([
    {
      id: 1,
      title: 'Social Media Content Templates',
      creator: 'Creative Pro Studio',
      description: 'Pre-designed templates for Instagram, TikTok, and YouTube content creation.',
      thumbnail_url: 'https://images.pexels.com/photos/1707960/pexels-photo-1707960.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'templates',
      type: 'template',
      price: 'Free'
    },
    {
      id: 2,
      title: 'The Creator\'s Handbook',
      creator: 'Industry Experts',
      description: 'Comprehensive guide to building and growing your creative career.',
      thumbnail_url: 'https://images.pexels.com/photos/3629698/pexels-photo-3629698.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'books',
      type: 'book',
      price: 'UGX 150,000'
    },
    {
      id: 3,
      title: 'Screenwriting Masterclass Scripts',
      creator: 'Film Academy',
      description: 'Sample scripts for various film genres and formats.',
      thumbnail_url: 'https://images.pexels.com/photos/1707960/pexels-photo-1707960.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'scripts',
      type: 'script',
      price: 'UGX 100,000'
    },
    {
      id: 4,
      title: 'Songwriting Beat Library',
      creator: 'Music Producers Inc',
      description: 'Royalty-free beats and instrumentals for your next track.',
      thumbnail_url: 'https://images.pexels.com/photos/164853/pexels-photo-164853.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'lyrics',
      type: 'music',
      price: 'UGX 80,000'
    },
    {
      id: 5,
      title: 'Adobe Creative Suite Discount',
      creator: 'Software Partners',
      description: 'Exclusive discounts on professional creative software.',
      thumbnail_url: 'https://images.pexels.com/photos/3594613/pexels-photo-3594613.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'software',
      type: 'software',
      price: 'UGX 250,000'
    },
    {
      id: 6,
      title: 'Cinematic Presets Bundle',
      creator: 'Visual Effects Lab',
      description: 'Color grading and video editing presets for professional results.',
      thumbnail_url: 'https://images.pexels.com/photos/3629698/pexels-photo-3629698.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'presets',
      type: 'preset',
      price: 'UGX 50,000'
    },
    {
      id: 7,
      title: 'Career Mentorship Program',
      creator: 'FlourishTalents Academy',
      description: 'One-on-one guidance from industry professionals.',
      thumbnail_url: 'https://images.pexels.com/photos/1707960/pexels-photo-1707960.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'guidance',
      type: 'mentorship',
      price: 'UGX 500,000'
    }
  ]);

  const [talents, setTalents] = useState<any[]>([]);

  const [agencies, setAgencies] = useState<any[]>([
    {
      id: 1,
      name: 'Creative Collective Agency',
      type: 'Full-Service Creative Agency',
      category: 'design',
      location: 'Kampala, Uganda',
      rating: 4.9,
      reviews: 234,
      teamSize: 12,
      startingRate: 450000,
      logo: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['Brand Design', 'Web Development', 'Marketing Strategy', 'Content Creation'],
      completedProjects: 189,
      responseTime: '4 hours',
      description: 'Award-winning creative agency specializing in brand identity and digital experiences.',
      specialties: ['Tech Startups', 'E-commerce', 'Healthcare', 'Finance']
    },
    {
      id: 2,
      name: 'Elite Marketing Solutions',
      type: 'Digital Marketing Agency',
      category: 'digital-marketing',
      location: 'Mbarara, Uganda',
      rating: 4.8,
      reviews: 178,
      teamSize: 8,
      startingRate: 360000,
      logo: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['PPC Management', 'SEO', 'Social Media', 'Email Marketing'],
      completedProjects: 156,
      responseTime: '2 hours',
      description: 'Results-driven marketing agency with proven track record of ROI growth.',
      specialties: ['SaaS', 'E-commerce', 'Local Business', 'B2B']
    }
  ]);

  const [teams, setTeams] = useState<any[]>([
    {
      id: 1,
      name: 'Film Crew Kampala',
      type: 'Production Team',
      category: 'film-video-production',
      location: 'Kampala, Uganda',
      rating: 4.7,
      reviews: 98,
      teamSize: 6,
      startingRate: 280000,
      logo: 'https://images.pexels.com/photos/269140/pexels-photo-269140.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['Cinematography', 'Lighting', 'Sound'],
      completedProjects: 72,
      responseTime: '3 hours',
      description: 'Experienced film crew available for short and feature productions.',
      specialties: ['Short Films', 'Commercials', 'Music Videos']
    },
    {
      id: 2,
      name: 'Event Crew Uganda',
      type: 'Event Production Team',
      category: 'event-management',
      location: 'Kampala, Uganda',
      rating: 4.8,
      reviews: 120,
      teamSize: 10,
      startingRate: 320000,
      logo: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['Stage Setup', 'Sound', 'Lighting', 'Coordination'],
      completedProjects: 150,
      responseTime: '2 hours',
      description: 'Full-service event crew for conferences, concerts and launches.',
      specialties: ['Corporate', 'Concerts', 'Launches']
    },
    {
      id: 3,
      name: 'Prime Photography Studio',
      type: 'Photography Studio',
      category: 'photography',
      location: 'Kampala, Uganda',
      rating: 4.8,
      reviews: 140,
      teamSize: 7,
      startingRate: 300000,
      logo: 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['Portraits', 'Product Photography', 'Studio Lighting'],
      completedProjects: 210,
      responseTime: '1 hour',
      description: 'Professional studio offering commercial and portrait photography services.',
      specialties: ['Portraits', 'E-commerce', 'Editorial']
    },
    {
      id: 4,
      name: 'SoundForge Studios',
      type: 'Recording Studio',
      category: 'audio-production',
      location: 'Kampala, Uganda',
      rating: 4.9,
      reviews: 200,
      teamSize: 5,
      startingRate: 250000,
      logo: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['Recording', 'Mixing', 'Mastering', 'Voiceovers'],
      completedProjects: 320,
      responseTime: '2 hours',
      description: 'State-of-the-art recording studio for artists, ads and film audio.',
      specialties: ['Music Production', 'Voice Over', 'Podcast']
    },
    {
      id: 5,
      name: 'Aurora Records',
      type: 'Record Label',
      category: 'record-label',
      location: 'Kampala, Uganda',
      rating: 4.6,
      reviews: 88,
      teamSize: 9,
      startingRate: 0,
      logo: 'https://images.pexels.com/photos/164853/pexels-photo-164853.jpeg?auto=compress&cs=tinysrgb&w=150',
      services: ['A&R', 'Distribution', 'Artist Management', 'Marketing'],
      completedProjects: 95,
      responseTime: '4 hours',
      description: 'Independent record label developing and distributing music projects.',
      specialties: ['Afrobeats', 'Hip-Hop', 'Pop']
    }
  ]);

  const filteredTalents = talents.filter((talent) => {
    const matchesCategory = selectedCategory === 'all' || talent.category === selectedCategory;
    const matchesSearch =
      talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredTeams = teams.filter((team) => {
    const matchesCategory = selectedCategory === 'all' || team.category === selectedCategory;
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.services.some((service) => service.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredAgencies = agencies.filter((agency) => {
    const matchesCategory = selectedCategory === 'all' || agency.category === selectedCategory;
    const matchesSearch =
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.services.some((service) => service.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredProjects = projects.filter((project) => {
    // Filter by entity type when on Apply tab
    // Convert plural entityType ('talents', 'teams', 'agencies') to singular for comparison with provider_type ('talent', 'team', 'agency')
    const entityTypeSingular = entityType === 'talents' ? 'talent' : entityType === 'teams' ? 'team' : 'agency';
    const matchesEntityType = activeTab !== 'apply' || project.providerType === entityTypeSingular;

    const matchesCategory =
      selectedCategory === 'all' ||
      project.type === selectedCategory ||
      project.skills.some((s) => s.toLowerCase().includes(selectedCategory.replace(/-/g, ' ')));
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEntityType && matchesCategory && matchesSearch;
  });

  const parseUGX = (s: string) => Number(s.replace(/[^0-9]/g, '')) || 0;

  const sortItems = <T,>(items: T[], type: 'talent' | 'team' | 'agency' | 'project') => {
    const getMetric = (it: any) => {
      switch (sortField) {
        case 'price':
          if (type === 'talent') return it.hourlyRate || 0;
          if (type === 'project') return parseUGX(it.budget) || 0;
          return it.startingRate || 0;
        case 'rating':
          return it.rating || 0;
        case 'popularity':
          return (it.portfolio?.totalViews || it.completedProjects || it.reviews || 0) as number;
        case 'reviews':
          return it.reviews || 0;
        case 'all':
          return (it.portfolio?.totalViews || it.completedProjects || it.reviews || 0) as number;
        default:
          return 0;
      }
    };
    return items.slice().sort((a, b) => (sortOrder === 'asc' ? getMetric(a) - getMetric(b) : getMetric(b) - getMetric(a)));
  };

  const sortedTalents = sortItems(filteredTalents, 'talent');
  const sortedTeams = sortItems(filteredTeams, 'team');
  const sortedAgencies = sortItems(filteredAgencies, 'agency');
  const sortedProjects = sortItems(filteredProjects, 'project');

  const sponsorPackages = [
    {
      id: 1,
      project: 'Community Film Challenge',
      tiers: [
        { name: 'Bronze', amount: 'UGX 500,000', perks: ['Logo mention', 'Social shoutout'] },
        { name: 'Silver', amount: 'UGX 1,500,000', perks: ['Logo & link', '2 tickets', 'Social shoutout'] },
        { name: 'Gold', amount: 'UGX 3,500,000', perks: ['Hero placement', '5 tickets', 'Booth space'] }
      ]
    },
    {
      id: 2,
      project: 'Emerging Artist EP',
      tiers: [
        { name: 'Associate', amount: 'UGX 800,000', perks: ['Credits mention'] },
        { name: 'Partner', amount: 'UGX 2,000,000', perks: ['Credits + social pack'] },
        { name: 'Title Sponsor', amount: 'UGX 5,000,000', perks: ['Title bill', 'Launch stage mention'] }
      ]
    }
  ];

  const recognitions = [
    {
      id: 1,
      title: 'Best Short Film 2025',
      org: 'FlourishTalents Awards',
      summary: '"The Last Stand" by Starlight Pictures',
      image:
        'https://images.pexels.com/photos/269140/pexels-photo-269140.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Outstanding Brand Campaign',
      org: 'Creatives Guild',
      summary: 'Innovate Inc. Ambassador Program',
      image:
        'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const handleApply = (projectId: number) => {
    alert(`Applied to project ${projectId}`);
  };

  const handleHire = (id: number, type: 'talent' | 'team' | 'agency') => {
    if (!user) {
      alert('Please sign up or sign in to proceed.');
      navigate('/signin');
      return;
    }
    if (user.role === 'creator') {
      alert('Creators cannot hire. Switch to Apply tab to apply to jobs.');
      return;
    }
    if (user.tier === 'free') {
      alert('Upgrade to Premium to hire talents, teams and agencies!');
      return;
    }
    alert(`Hiring request sent! The ${type} will be notified and will respond soon.`);
  };

  const handleViewPortfolio = () => {
    alert('Opening portfolio in new window...');
  };

  const handleEditListing = (listing: ProjectsPageProvider) => {
    setEditingListing(listing);
    setIsEditModalOpen(true);
  };

  const handleSaveListing = async (updates: Partial<ProjectsPageProvider>) => {
    if (!editingListing) return;

    try {
      await updateProvider(editingListing.id, updates);

      // Update the listing in the appropriate array
      const listing = transformProviderToListing(
        { ...editingListing, ...updates },
        editingListing.provider_type
      );

      if (editingListing.provider_type === 'talent') {
        setTalents(prev => prev.map(t => t.id === listing.id ? listing : t));
      } else if (editingListing.provider_type === 'team') {
        setTeams(prev => prev.map(t => t.id === listing.id ? listing : t));
      } else if (editingListing.provider_type === 'agency') {
        setAgencies(prev => prev.map(a => a.id === listing.id ? listing : a));
      }

      alert('Listing updated successfully!');
      setIsEditModalOpen(false);
      setEditingListing(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update listing';
      alert(`Error: ${errorMsg}`);
      throw err;
    }
  };

  const handleDeleteListing = async (listing: ProjectsPageProvider) => {
    try {
      await deleteProvider(listing.id);

      // Remove from the appropriate array
      if (listing.provider_type === 'talent') {
        setTalents(prev => prev.filter(t => t.id !== listing.id));
      } else if (listing.provider_type === 'team') {
        setTeams(prev => prev.filter(t => t.id !== listing.id));
      } else if (listing.provider_type === 'agency') {
        setAgencies(prev => prev.filter(a => a.id !== listing.id));
      }

      alert('Listing deleted successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete listing';
      alert(`Error: ${errorMsg}`);
      throw err;
    }
  };

  const handleEditJob = (job: ProjectsPageJob) => {
    setEditingJob(job);
    setIsJobEditModalOpen(true);
  };

  const handleSaveJob = async (jobId: string, updates: Partial<ProjectsPageJob>) => {
    try {
      await updateJob(jobId, updates);
      alert('Job updated successfully!');
      setIsJobEditModalOpen(false);
      setEditingJob(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update job';
      alert(`Error: ${errorMsg}`);
      throw err;
    }
  };

  const handleDeleteJob = async (job: ProjectsPageJob) => {
    try {
      await deleteJob(job.id);
      alert('Job deleted successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete job';
      alert(`Error: ${errorMsg}`);
      throw err;
    }
  };

  // Helper function to transform form data to listing format
  const transformProviderToListing = (provider: any, kind: 'talent' | 'team' | 'agency') => {
    // Use existing ID if from database, otherwise generate new one
    let id = provider.id;
    if (!id) {
      const maxId = Math.max(
        ...talents.map(t => Number(t.id) || 0),
        ...teams.map(t => Number(t.id) || 0),
        ...agencies.map(a => Number(a.id) || 0),
        0
      );
      id = maxId + 1;
    }

    const baseData = {
      id,
      providerId: provider.id, // Keep original provider ID for edit/delete
      userId: provider.user_id, // Track who owns this listing
      name: provider.name,
      category: provider.category,
      location: provider.optional_location || 'Remote',
      rating: provider.rating || 4.5 + Math.random() * 0.5,
      reviews: provider.reviews_count || Math.floor(Math.random() * 200) + 20,
      description: provider.description,
      completedProjects: provider.completed_projects || 0,
      responseTime: provider.response_time || ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours'][Math.floor(Math.random() * 5)],
    };

    // Handle services - could be array of objects or strings
    const serviceNames = Array.isArray(provider.services)
      ? provider.services.map((s: any) => typeof s === 'string' ? s : s.name)
      : [];

    // Handle avatar - use provider avatar_url from database or generate from file
    const getAvatarUrl = () => {
      if (provider.avatar_url) return provider.avatar_url;
      if (provider.avatar_file) return URL.createObjectURL(provider.avatar_file);
      return kind === 'talent'
        ? 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png?auto=compress&cs=tinysrgb&w=150'
        : 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=150';
    };

    if (kind === 'talent') {
      return {
        ...baseData,
        title: provider.title_or_type,
        hourlyRate: provider.services?.[0]?.price ? Number(provider.services[0].price) : 0,
        avatar: getAvatarUrl(),
        skills: serviceNames,
        certifications: [],
        portfolio: { projects: 0, totalViews: 0 },
      };
    } else if (kind === 'team') {
      return {
        ...baseData,
        type: provider.title_or_type,
        teamSize: provider.team_size || 1,
        startingRate: provider.services?.[0]?.price ? Number(provider.services[0].price) : 0,
        logo: getAvatarUrl(),
        services: serviceNames,
        specialties: serviceNames.slice(0, 3),
      };
    } else {
      return {
        ...baseData,
        type: provider.title_or_type,
        teamSize: provider.team_size || 1,
        startingRate: provider.services?.[0]?.price ? Number(provider.services[0].price) : 0,
        logo: getAvatarUrl(),
        services: serviceNames,
        specialties: serviceNames.slice(0, 3),
      };
    }
  };


  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-300">Manage your projects</p>
          </div>
          {activeTab !== 'add' && (
            <div className="hidden md:flex items-center gap-3 pr-2">
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as 'all' | 'price' | 'rating' | 'popularity' | 'reviews')}
                  className="pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="all" className="bg-gray-800">All</option>
                  <option value="price" className="bg-gray-800">Sort by cost</option>
                  <option value="rating" className="bg-gray-800">Sort by ratings</option>
                  <option value="popularity" className="bg-gray-800">Sort by popularity</option>
                  <option value="reviews" className="bg-gray-800">Sort by reviews</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder('asc')}
                  aria-pressed={sortOrder === 'asc'}
                  className={`${sortOrder === 'asc' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white' : 'glass-effect text-gray-300 hover:text-white'} p-2 rounded-lg transition-colors`}
                  title="Ascending"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 5l6 6H6l6-6z"/></svg>
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  aria-pressed={sortOrder === 'desc'}
                  className={`${sortOrder === 'desc' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white' : 'glass-effect text-gray-300 hover:text-white'} p-2 rounded-lg transition-colors`}
                  title="Descending"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 19l-6-6h12l-6 6z"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Tabs: Hire | Apply | Sponsor | Recognition */}
        <div className="flex space-x-1 glass-effect p-2 rounded-xl overflow-x-auto whitespace-nowrap md:w-full mb-8">
          <button
            onClick={() => setActiveTab('hire')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'hire'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>Hire</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'apply'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Apply</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Manage</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'resources'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Resources</span>
          </button>
          <button
            onClick={() => setActiveTab('sponsor')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'sponsor'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span>Sponsorship</span>
          </button>
          <button
            onClick={() => setActiveTab('recognition')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'recognition'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Recognition</span>
          </button>
        </div>

        {/* Search + Radio Entity + Category Select */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center">
          {activeTab !== 'add' ? (
            <div className="md:basis-1/2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  activeTab === 'apply' ? 'Search jobs...' : activeTab === 'hire' ? 'Search by service or provider name...' : activeTab === 'resources' ? 'Search templates & resources...' : activeTab === 'sponsor' ? 'Search sponsorships...' : 'Search recognitions...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-3 md:gap-4 md:pr-4">
              <button
                onClick={() => setAddTabView('jobs')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  addTabView === 'jobs'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                    : 'glass-effect text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                <span className="text-sm">Jobs</span>
              </button>
              <button
                onClick={() => setAddTabView('services')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  addTabView === 'services'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                    : 'glass-effect text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                <span className="text-sm">Services</span>
              </button>
            </div>
          )}

          <div className="md:basis-1/3 flex items-center justify-center gap-4 glass-effect px-3 py-2 rounded-xl border border-white/10">
              {(
                [
                  { id: 'talents', label: 'Talent' },
                  { id: 'teams', label: 'Team' },
                  { id: 'agencies', label: 'Agency' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEntityType(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    entityType === opt.id ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  aria-pressed={entityType === opt.id}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-full border ${
                      entityType === opt.id ? 'bg-rose-500 border-rose-400' : 'border-gray-400'
                    }`}
                  />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>

          {(activeTab !== 'resources' && activeTab !== 'add') && (
            <div className="md:basis-1/6 flex items-center space-x-3">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              >
                {hireApplyCategories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'add' && (
            <div className="md:basis-1/6 flex items-center space-x-3">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedAddCategory}
                onChange={(e) => setSelectedAddCategory(e.target.value)}
                className="flex-1 px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              >
                {addTabCategories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'resources' && (
              <div className="md:basis-1/6 flex items-center space-x-3">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  {resourcesCategories.map((category) => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {activeTab !== 'add' && (
            <div className="flex items-center gap-3 md:hidden mt-2 w-full">
              <span className="text-gray-400 flex-shrink-0">Sort by</span>
              <div className="flex items-center gap-2 w-full">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as 'all' | 'price' | 'rating' | 'popularity' | 'reviews')}
                  className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="all" className="bg-gray-800">All</option>
                  <option value="price" className="bg-gray-800">Cost</option>
                  <option value="rating" className="bg-gray-800">Ratings</option>
                  <option value="popularity" className="bg-gray-800">Popularity</option>
                  <option value="reviews" className="bg-gray-800">Reviews</option>
                </select>
                <button
                  onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
                  className={`p-3 rounded-lg transition-colors ${sortOrder === 'desc' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white' : 'glass-effect text-gray-300 hover:text-white'}`}
                  aria-pressed={sortOrder === 'asc'}
                  title="Toggle order"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    {sortOrder === 'desc' ? (
                      <path d="M12 5l6 6H6l6-6z" />
                    ) : (
                      <path d="M12 19l-6-6h12l-6 6z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">

          {activeTab === 'add' && addTabView === 'jobs' && (
            <div className="grid grid-cols-1 gap-6 lg:col-span-3">
              {/* Post a Job */}
              <div className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
                <h3 className="text-2xl font-semibold text-white mb-1">Post a Job</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Create a new job and hire talent
                </p>
                <ImprovedAddJobForm
                  category={selectedAddCategory}
                  providerType={entityType === 'talents' ? 'talent' : entityType === 'teams' ? 'team' : 'agency'}
                  onCreate={async (job) => {
                    try {
                      // Set status to 'published' so it appears immediately in Apply tab
                      const publishedJob = {
                        ...job,
                        status: 'published'
                      };

                      // Save to Supabase database
                      await createJob(publishedJob);

                      setActiveTab('apply');
                      setSearchQuery('');
                      alert('Job posted successfully! Your job is now live and visible to all.');
                    } catch (err) {
                      const errorMsg = err instanceof Error ? err.message : 'Failed to create job posting';
                      alert(`Error: ${errorMsg}`);
                    }
                  }}
                  isLoading={jobsLoading}
                />
              </div>
            </div>
          )}

          {activeTab === 'add' && addTabView === 'services' && (
            <div className="grid grid-cols-1 gap-6 lg:col-span-3">
              {/* Showcase your services */}
              <div className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
                <h3 className="text-2xl font-semibold text-white mb-1">Offer your services</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Showcase your skills and get hired
                </p>
                <ImprovedAddProviderForm
                  category={selectedAddCategory}
                  providerType={entityType === 'talents' ? 'talent' : entityType === 'teams' ? 'team' : 'agency'}
                  onCreate={async (provider, kind) => {
                    try {
                      // Change status to 'published' so it appears immediately
                      const publishedProvider = {
                        ...provider,
                        status: 'published'
                      };

                      // Save to Supabase database
                      const savedProvider = await createProvider(publishedProvider);

                      // Transform and add to local state for instant display
                      const listing = transformProviderToListing(publishedProvider, kind);
                      if (kind === 'talent') {
                        setTalents([...talents, listing]);
                      } else if (kind === 'team') {
                        setTeams([...teams, listing]);
                      } else {
                        setAgencies([...agencies, listing]);
                      }

                      setActiveTab('hire');
                      alert(`Service listed successfully! Your listing is now live and visible to all.`);
                    } catch (err) {
                      const errorMsg = err instanceof Error ? err.message : 'Failed to list service';
                      alert(`Error: ${errorMsg}`);
                    }
                  }}
                  isLoading={providersLoading}
                />
              </div>
            </div>
          )}

          {activeTab === 'apply' &&
            sortedProjects.map((project) => {
              const isOwner = user?.id === project.userId;
              const jobData = allJobs.find(j => j.id === project.jobId);
              return (
                <div key={project.id} className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                      <p className="text-gray-400 text-sm">{project.company}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        <span className="text-gray-300 text-sm">{project.location}</span>
                      </div>
                    </div>
                    {isOwner && jobData && (
                      <ListingOwnerControls
                        listingId={jobData.id}
                        listingName={jobData.title}
                        listingType="job"
                        onEdit={() => handleEditJob(jobData)}
                        onDelete={() => handleDeleteJob(jobData)}
                      />
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mt-4 line-clamp-2">{project.description}</p>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {project.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-rose-400/20 text-rose-300 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {jobData?.application_deadline && (
                    <div className="mt-3 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">
                        Deadline: {new Date(jobData.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 gap-4">
                    {jobData && (jobData.budget_min || jobData.budget_max) && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500/10 to-purple-600/10 border border-rose-400/30 rounded-lg">
                        <Banknote className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-300 text-sm flex items-center gap-1">
                          <span className="text-rose-200 font-medium">{jobData.currency}</span>
                          {jobData.budget_min && jobData.budget_max
                            ? `${Number(jobData.budget_min).toLocaleString()} – ${Number(jobData.budget_max).toLocaleString()}`
                            : jobData.budget_max
                            ? `${Number(jobData.budget_max).toLocaleString()} `
                            : `${Number(jobData.budget_min).toLocaleString()} `}
                          {jobData.budget_max && !jobData.budget_min && <span className="text-xs ml-0.5">↓ max</span>}
                          {jobData.budget_min && !jobData.budget_max && <span className="text-xs ml-0.5">↑ min</span>}
                        </span>
                      </div>
                    )}
                    {!jobData || (!jobData.budget_min && !jobData.budget_max) ? <div></div> : null}
                    <button
                      onClick={() => handleApply(project.id)}
                      className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              );
            })}

          {activeTab === 'resources' &&
            resources
              .filter((resource) => {
                const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
                const matchesSearch =
                  resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  resource.creator.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .map((resource) => (
                <div key={resource.id} className="glass-effect rounded-2xl overflow-hidden hover-lift">
                  <div className="relative aspect-video bg-gray-800">
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/60">
                      <Eye className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1 line-clamp-2">{resource.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{resource.creator}</p>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-semibold text-sm">{resource.price}</span>
                      <button className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
                        Get Access
                      </button>
                    </div>
                  </div>
                </div>
              ))}

          {activeTab === 'resources' && resources.filter((r) => selectedCategory === 'all' || r.category === selectedCategory).filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.creator.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="lg:col-span-3 text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
            </div>
          )}

          {activeTab === 'hire' && entityType === 'talents' &&
            sortedTalents.map((talent) => {
              const isOwner = user?.id === talent.userId;
              const providerData = allProviders.find(p => p.id === talent.providerId);
              return (
              <div key={talent.id} className="glass-effect rounded-2xl overflow-hidden hover-lift">
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <img src={talent.avatar} alt={talent.name} className="w-16 h-16 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white">{talent.name}</h3>
                            <p className="text-gray-400 text-sm">{talent.title}</p>
                            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
                              <Briefcase className="w-4 h-4" />
                              <span>{talent.completedProjects} projects</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white text-lg font-semibold">{talent.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-xs">({talent.reviews} ratings)</span>
                      {isOwner && providerData && (
                        <ListingOwnerControls
                          listingId={talent.providerId}
                          listingName={talent.name}
                          listingType="talent"
                          onEdit={() => handleEditListing(providerData)}
                          onDelete={() => handleDeleteListing(providerData)}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-4">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{talent.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{talent.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Responds in {talent.responseTime}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-white text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {talent.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-rose-400/20 text-rose-300 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {talent.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          +{talent.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleViewPortfolio}
                      className="flex-1 py-2 glass-effect text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Portfolio</span>
                    </button>
                    <button
                      onClick={() => handleHire(talent.id, 'talent')}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Hire Talent
                    </button>
                  </div>
                </div>
              </div>
            );
            })}

          {activeTab === 'hire' && entityType === 'teams' &&
            sortedTeams.map((team) => {
              const isOwner = user?.id === team.userId;
              const providerData = allProviders.find(p => p.id === team.providerId);
              return (
              <div key={team.id} className="glass-effect rounded-2xl overflow-hidden hover-lift">
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{team.name}</h3>
                        <p className="text-gray-400 text-sm">{team.type}</p>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{team.teamSize} members</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white text-lg font-semibold">{team.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-xs">({team.reviews} ratings)</span>
                      {isOwner && providerData && (
                        <ListingOwnerControls
                          listingId={team.providerId}
                          listingName={team.name}
                          listingType="team"
                          onEdit={() => handleEditListing(providerData)}
                          onDelete={() => handleDeleteListing(providerData)}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-4">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{team.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{team.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Responds in {team.responseTime}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-white text-sm font-medium mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {team.services.slice(0, 3).map((service, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-400/20 text-purple-300 text-xs rounded">
                          {typeof service === 'string' ? service : service.name}
                        </span>
                      ))}
                      {team.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          +{team.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleViewPortfolio}
                      className="flex-1 py-2 glass-effect text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Work</span>
                    </button>
                    <button
                      onClick={() => handleHire(team.id, 'team')}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Hire Team
                    </button>
                  </div>
                </div>
              </div>
            );
            })}

          {activeTab === 'hire' && entityType === 'agencies' &&
            sortedAgencies.map((agency) => {
              const isOwner = user?.id === agency.userId;
              const providerData = allProviders.find(p => p.id === agency.providerId);
              return (
              <div key={agency.id} className="glass-effect rounded-2xl overflow-hidden hover-lift">
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <img src={agency.logo} alt={agency.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{agency.name}</h3>
                        <p className="text-gray-400 text-sm">{agency.type}</p>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{agency.teamSize} members</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white text-lg font-semibold">{agency.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-xs">({agency.reviews} ratings)</span>
                      {isOwner && providerData && (
                        <ListingOwnerControls
                          listingId={agency.providerId}
                          listingName={agency.name}
                          listingType="agency"
                          onEdit={() => handleEditListing(providerData)}
                          onDelete={() => handleDeleteListing(providerData)}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-4">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{agency.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{agency.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Responds in {agency.responseTime}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-white text-sm font-medium mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {agency.services.slice(0, 3).map((service, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-400/20 text-purple-300 text-xs rounded">
                          {typeof service === 'string' ? service : service.name}
                        </span>
                      ))}
                      {agency.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          +{agency.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleViewPortfolio}
                      className="flex-1 py-2 glass-effect text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Work</span>
                    </button>
                    <button
                      onClick={() => handleHire(agency.id, 'agency')}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Hire Agency
                    </button>
                  </div>
                </div>
              </div>
            );
            })}

          {activeTab === 'sponsor' &&
            sponsorPackages.map((pack) => (
              <div key={pack.id} className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{pack.project}</h3>
                <p className="text-gray-300 mb-4">Choose a sponsorship tier and support this project.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pack.tiers.map((t) => (
                    <div key={t.name} className="p-4 rounded-lg border border-white/10 bg-white/5">
                      <div className="text-white font-medium">{t.name}</div>
                      <div className="text-rose-300 text-sm mb-2">{t.amount}</div>
                      <ul className="text-gray-300 text-xs space-y-1">
                        {t.perks.map((p) => (
                          <li key={p}>• {p}</li>
                        ))}
                      </ul>
                      <button className="mt-3 w-full py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg">
                        Sponsor Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {activeTab === 'recognition' &&
            recognitions.map((r) => (
              <div key={r.id} className="glass-effect rounded-2xl overflow-hidden hover-lift">
                <div className="relative aspect-video bg-gray-800">
                  <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                    HONOREE
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white">{r.title}</h3>
                  <p className="text-gray-400 text-sm mb-1">{r.org}</p>
                  <p className="text-gray-300 text-sm">{r.summary}</p>
                </div>
              </div>
            ))}
        </div>

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 gap-6 lg:col-span-3">
            <ManageTab />
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'apply' && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}
        {activeTab === 'hire' && entityType === 'talents' && filteredTalents.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No talents found</h3>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}
        {activeTab === 'hire' && entityType === 'teams' && filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}
        {activeTab === 'hire' && entityType === 'agencies' && filteredAgencies.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No agencies found</h3>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingListing && (
        <ListingEditModal
          listing={editingListing}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingListing(null);
          }}
          onSave={handleSaveListing}
        />
      )}

      {/* Job Edit Modal */}
      {editingJob && (
        <JobEditModal
          job={editingJob}
          isOpen={isJobEditModalOpen}
          onClose={() => {
            setIsJobEditModalOpen(false);
            setEditingJob(null);
          }}
          onSave={handleSaveJob}
        />
      )}
    </div>
  );
}
