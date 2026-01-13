import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  Phone,
  Mail,
  TrendingUp,
  Award,
  Filter,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Send,
  Calendar,
  DollarSign,
  CheckCircle,
  MapPin,
  Users,
  Package,
  AlertCircle,
  X,
  Clock,
  Loader,
  Share2,
  Edit,
  Image,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import EditEventModal from './EditEventModal';
import MyEventCard from './MyEventCard';
import { useAuth } from '../context/AuthContext';
import {
  createEvent,
  getUserEvents,
  publishEvent,
  bookEventServices,
  getEventServiceBookings,
  cancelServiceBooking,
  hideEventFromMyEvents,
  hideEventFromJoinTab,
  restoreEventToMyEvents,
  updateEvent,
  uploadEventImage,
  updateEventImage,
} from '../lib/eventServices';
import type { ServiceProvider, CreateEventFormData, Event, EventServiceBooking } from '../types/events';

const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'sp-1',
    name: 'Grand Hall Venues',
    category: 'venue',
    description: 'Premier event venues with modern facilities for conferences, weddings, and corporate events',
    expertise: 'Large events, conferences, weddings, 100-500 capacity',
    base_price: 2000000,
    rating: 4.8,
    reviews_count: 124,
    contact_email: 'info@grandhall.com',
    contact_phone: '+256-700-123456',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-2',
    name: 'Elite Tents & Decor',
    category: 'decor',
    description: 'Professional event decoration, tent rental, and themed setups',
    expertise: 'Weddings, galas, corporate events, creative themes',
    base_price: 450000,
    rating: 4.7,
    reviews_count: 78,
    contact_email: 'elite@tents.com',
    contact_phone: '+256-700-234567',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-3',
    name: 'Prime Ushers',
    category: 'ushering',
    description: 'Trained and professional ushering staff with crowd management expertise',
    expertise: 'Friendly, trained staff, crowd management, registration support',
    base_price: 120000,
    rating: 4.6,
    reviews_count: 46,
    contact_email: 'contact@primeushers.com',
    contact_phone: '+256-700-345678',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-4',
    name: 'SoundWorks Ltd',
    category: 'audio',
    description: 'Complete audio solutions including PA systems, mixing, and live sound engineering',
    expertise: 'PA systems, mixing, live sound, professional equipment',
    base_price: 600000,
    rating: 4.9,
    reviews_count: 98,
    contact_email: 'hello@soundworks.com',
    contact_phone: '+256-700-456789',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-5',
    name: 'CaterPro Solutions',
    category: 'catering',
    description: 'Full-service catering for events of all sizes with diverse menu options',
    expertise: 'Buffet, plated service, dietary options, large quantities',
    base_price: 350000,
    rating: 4.5,
    reviews_count: 65,
    contact_email: 'catering@caterpro.com',
    contact_phone: '+256-700-567890',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-6',
    name: 'LightUp Studios',
    category: 'photography',
    description: 'Professional event photography and videography with drone capabilities',
    expertise: 'Weddings, corporate events, portraits, drone footage',
    base_price: 800000,
    rating: 4.9,
    reviews_count: 112,
    contact_email: 'book@lightupstudios.com',
    contact_phone: '+256-700-678901',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-7',
    name: 'StarDJ Entertainment',
    category: 'entertainment',
    description: 'Professional DJs, MCs, and live entertainment services',
    expertise: 'Weddings, parties, corporate events, special effects',
    base_price: 500000,
    rating: 4.7,
    reviews_count: 89,
    contact_email: 'info@stardj.com',
    contact_phone: '+256-700-789012',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-8',
    name: 'SafeGuard Security',
    category: 'security',
    description: 'Professional event security and crowd control with trained personnel',
    expertise: 'Large events, VIP protection, access control, emergency response',
    base_price: 400000,
    rating: 4.8,
    reviews_count: 73,
    contact_email: 'security@safeguard.com',
    contact_phone: '+256-700-890123',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-9',
    name: 'RideShare Transport',
    category: 'transport',
    description: 'Event transportation and shuttle services for guest convenience',
    expertise: 'Guest shuttles, VIP transport, logistics coordination',
    base_price: 300000,
    rating: 4.6,
    reviews_count: 54,
    contact_email: 'ride@rideshare.com',
    contact_phone: '+256-700-901234',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface CartItem {
  provider: ServiceProvider;
  quantity: number;
}

interface MyEvent extends Event {
  bookings?: EventServiceBooking[];
}

const featureOptions = ['Networking', 'Certificates', 'Recording', 'Prizes', 'Refreshments', 'Live Sessions', 'Live Judging', 'Panel Discussion', 'Premium Materials', 'VIP Access', 'Swag Bag'];

export default function OrganizeTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'create-event' | 'browse-services' | 'my-events'>('create-event');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'confirm'>('details');
  const [eventDate, setEventDate] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [userEvents, setUserEvents] = useState<MyEvent[]>([]);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [createForm, setCreateForm] = useState<CreateEventFormData & { customFeature?: string }>({
    eventName: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
    estimatedGuests: 100,
    budget: 5000000,
    organizerSpecification: '',
    attractions: '',
    features: [],
    customFeature: '',
    isLivestream: false,
    livestreamLink: '',
  });

  const categories = ['all', 'venue', 'catering', 'decor', 'audio', 'photography', 'entertainment', 'security', 'transport', 'ushering'];

  const filteredProviders = useMemo(() => {
    return mockServiceProviders
      .filter((provider) => {
        const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
        const matchesSearch =
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.expertise.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch && provider.available;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.base_price - b.base_price;
        if (sortBy === 'reviews') return b.reviews_count - a.reviews_count;
        return b.rating - a.rating;
      });
  }, [selectedCategory, searchQuery, sortBy]);

  // Load user events when component mounts or user changes
  useEffect(() => {
    if (user?.id && activeView === 'my-events') {
      loadUserEvents();
    }
  }, [user?.id, activeView]);

  const loadUserEvents = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const events = await getUserEvents(user.id);
      setUserEvents(events as MyEvent[]);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (provider: ServiceProvider) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.provider.id === provider.id);
      if (existing) {
        return prev.map((item) =>
          item.provider.id === provider.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { provider, quantity: 1 }];
    });
  };

  const removeFromCart = (providerId: string) => {
    setCart((prev) => prev.filter((item) => item.provider.id !== providerId));
  };

  const updateQuantity = (providerId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.provider.id === providerId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCost = cart.reduce((sum, item) => sum + item.provider.base_price * item.quantity, 0);
  const serviceFee = totalCost * 0.05;
  const grandTotal = totalCost + serviceFee;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      alert('Please sign in to create an event');
      return;
    }

    if (!createForm.eventName || !createForm.eventDate || !createForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Creating your event...');

    try {
      const { event, error } = await createEvent(user.id, user.email?.split('@')[0] || 'User', createForm);

      if (error) {
        alert(`Error creating event: ${error}`);
        return;
      }

      // Upload image if selected
      if (imageFile && event?.id) {
        console.log('Uploading image for event:', event.id);
        const { url, error: uploadError } = await uploadEventImage(imageFile, event.id);
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          alert(`Warning: Event created but image upload failed: ${uploadError}`);
        } else if (url) {
          console.log('Image uploaded successfully:', url);
          const { success, error: imgError } = await updateEventImage(event.id, user.id, url, false);
          if (imgError) {
            console.error('Failed to save image URL:', imgError);
          }
        }
      }

      alert('✓ Event created successfully! Now book service providers.');
      setSelectedEventForBooking(event?.id || null);
      setCreateForm({
        eventName: '',
        eventDate: '',
        eventTime: '',
        location: '',
        description: '',
        estimatedGuests: 100,
        budget: 5000000,
        organizerSpecification: '',
        attractions: '',
        features: [],
        customFeature: '',
        isLivestream: false,
        livestreamLink: '',
      });
      setImageFile(null);
      setActiveView('browse-services');
    } catch (err) {
      console.error('Error creating event:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCheckout = async () => {
    if (!user?.id) {
      alert('Please sign in to complete booking.');
      return;
    }

    if (cart.length === 0) {
      alert('Please add services to your cart.');
      return;
    }

    if (!selectedEventForBooking) {
      alert('Please create an event first.');
      return;
    }

    if (checkoutStep === 'details') {
      if (!eventDate) {
        alert('Please select an event date.');
        return;
      }
      setCheckoutStep('confirm');
    } else {
      setIsLoading(true);
      setLoadingMessage('Booking services...');

      try {
        const bookingData = cart.map(item => ({
          providerId: item.provider.id,
          providerName: item.provider.name,
          providerCategory: item.provider.category,
          quantity: item.quantity,
          basePrice: item.provider.base_price,
        }));

        const { success, error } = await bookEventServices(selectedEventForBooking, user.id, bookingData);

        if (error) {
          alert(`Error booking services: ${error}`);
          return;
        }

        alert(`✓ Booking confirmed!\n\nEvent Date: ${eventDate}\nTotal: UGX ${grandTotal.toLocaleString()}\n\nService providers will contact you within 24 hours.`);
        setCart([]);
        setEventDate('');
        setEventNotes('');
        setShowCheckout(false);
        setCheckoutStep('details');
        setSelectedEventForBooking(null);
        await loadUserEvents();
      } catch (err) {
        console.error('Error booking services:', err);
        alert('An unexpected error occurred');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    setLoadingMessage('Publishing event...');

    try {
      const { success, error } = await publishEvent(eventId, user.id);

      if (error) {
        alert(`Error publishing event: ${error}`);
        return;
      }

      alert('✓ Event published successfully! It\'s now visible in the Join tab.');
      await loadUserEvents();
    } catch (err) {
      console.error('Error publishing event:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleHideEventFromMyEvents = async (eventId: string) => {
    if (!user?.id) return;

    if (!confirm('Remove this event from My Events? (It will remain in the database for 30 days)')) return;

    setIsLoading(true);
    setLoadingMessage('Removing from My Events...');

    try {
      const { success, error } = await hideEventFromMyEvents(eventId, user.id);

      if (error) {
        alert(`Error removing event: ${error}`);
        return;
      }

      alert('✓ Event removed from My Events. You can restore it anytime.');
      await loadUserEvents();
    } catch (err) {
      console.error('Error removing event:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const toggleFeature = (feature: string) => {
    setCreateForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="glass-effect p-8 rounded-2xl text-center">
            <Loader className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">{loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-row gap-4">
        <button
          onClick={() => setActiveView('create-event')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'create-event'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Create Event</span>
        </button>
        <button
          onClick={() => setActiveView('browse-services')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'browse-services'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Book Services</span>
        </button>
        <button
          onClick={() => setActiveView('my-events')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'my-events'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <div className="flex flex-col md:flex-row items-center md:space-x-2">
            <span className="text-sm md:text-base">My Events</span>
            {userEvents.length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full font-bold">
                {userEvents.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeView === 'create-event' && (
        <div className="glass-effect p-8 rounded-2xl max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Event</h2>
            <p className="text-gray-300">Fill in your event details and set up professional services to bring it to life.</p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Event Name *</label>
                <input
                  type="text"
                  value={createForm.eventName}
                  onChange={(e) => setCreateForm({ ...createForm, eventName: e.target.value })}
                  placeholder="e.g., Annual Gala Dinner"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Event Date *</label>
                <input
                  type="date"
                  value={createForm.eventDate}
                  onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Time (Optional)</label>
                <input
                  type="time"
                  value={createForm.eventTime}
                  onChange={(e) => setCreateForm({ ...createForm, eventTime: e.target.value })}
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Location *</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="Event venue or address"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Organizer/Creator Specification</label>
                <input
                  type="text"
                  value={createForm.organizerSpecification}
                  onChange={(e) => setCreateForm({ ...createForm, organizerSpecification: e.target.value })}
                  placeholder="e.g., Creative Arts Institute, Tech Innovators Ltd"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Expected Guests</label>
                <input
                  type="number"
                  value={createForm.estimatedGuests}
                  onChange={(e) => setCreateForm({ ...createForm, estimatedGuests: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Budget (UGX)</label>
                <input
                  type="number"
                  value={createForm.budget}
                  onChange={(e) => setCreateForm({ ...createForm, budget: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
              <label className="block text-white font-semibold mb-2">Main Speakers/Artistes Featured</label>
              <input
                type="text"
                value={createForm.attractions}
                onChange={(e) => setCreateForm({ ...createForm, attractions: e.target.value })}
                placeholder="e.g., John Smith, Jane Doe (comma-separated)"
                className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <ImageUploadField
            value={imageFile}
            preview={imageFile ? URL.createObjectURL(imageFile) : null}
            onChange={setImageFile}
            label="Event Image"
          />

          <div>
            <label className="block text-white font-semibold mb-2">Event Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe your event, theme, special requirements..."
                rows={4}
                className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">Event Features & Perks</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {featureOptions.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      createForm.features.includes(feature)
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                        : 'glass-effect text-gray-300 hover:text-white'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createForm.customFeature || ''}
                  onChange={(e) => setCreateForm({ ...createForm, customFeature: e.target.value })}
                  placeholder="Add custom feature..."
                  className="flex-1 px-3 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (createForm.customFeature?.trim()) {
                      setCreateForm({
                        ...createForm,
                        features: [...createForm.features, createForm.customFeature.trim()],
                        customFeature: ''
                      });
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                >
                  Add
                </button>
              </div>
              {createForm.features.length > featureOptions.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {createForm.features.slice(featureOptions.length).map((feature, idx) => (
                    <div key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs flex items-center gap-2">
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => setCreateForm({
                          ...createForm,
                          features: createForm.features.filter((_, i) => i !== featureOptions.length + idx)
                        })}
                        className="text-blue-400 hover:text-blue-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isLivestream}
                  onChange={(e) => setCreateForm({ ...createForm, isLivestream: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 text-rose-500 focus:ring-rose-400"
                />
                <span className="text-white font-semibold">This event will have a livestream</span>
              </label>

              {createForm.isLivestream && (
                <input
                  type="url"
                  value={createForm.livestreamLink}
                  onChange={(e) => setCreateForm({ ...createForm, livestreamLink: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeView === 'browse-services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Event Services Directory</h2>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 transition-all text-sm md:text-base"
                >
                  <option value="rating" className="bg-gray-800">
                    Top Rated
                  </option>
                  <option value="price" className="bg-gray-800">
                    Price (Low to High)
                  </option>
                  <option value="reviews" className="bg-gray-800">
                    Most Reviewed
                  </option>
                </select>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                        : 'glass-effect text-gray-300 hover:text-white'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="glass-effect p-5 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                          <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full whitespace-nowrap">
                            {provider.category}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{provider.description}</p>
                        <div className="flex items-center space-x-1 mb-3 text-sm text-gray-400">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span>{provider.expertise}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 text-xs text-gray-400">
                          {provider.contact_phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{provider.contact_phone}</span>
                            </div>
                          )}
                          {provider.contact_email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{provider.contact_email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-between space-y-4">
                        <div className="w-full md:w-auto text-right">
                          <div className="flex items-center space-x-3 justify-between md:justify-end mb-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-white font-semibold">{provider.rating.toFixed(1)}</span>
                            </div>
                            {provider.reviews_count > 80 && (
                              <div className="flex items-center space-x-1 text-purple-400">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs">Popular</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-3">({provider.reviews_count} reviews)</p>
                          <div className="text-sm text-gray-400 mb-3">Starting at</div>
                          <div className="text-2xl font-bold text-white">UGX {provider.base_price.toLocaleString()}</div>
                        </div>

                        <button
                          onClick={() => addToCart(provider)}
                          className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-sm md:text-base"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProviders.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No providers found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-effect p-6 rounded-2xl sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                </h3>
                {cart.length > 0 && (
                  <span className="px-3 py-1 bg-rose-500 text-white text-sm font-bold rounded-full">
                    {cart.length}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400 text-sm">
                    Add service providers to build your event booking cart.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.provider.id} className="bg-white/5 p-4 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm mb-1">{item.provider.name}</h4>
                            <p className="text-gray-400 text-xs">{item.provider.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.provider.id)}
                            className="text-rose-400 hover:text-rose-300 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.provider.id, -1)}
                              className="p-1 glass-effect rounded text-gray-300 hover:text-white transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-white font-semibold w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.provider.id, 1)}
                              className="p-1 glass-effect rounded text-gray-300 hover:text-white transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              {(item.provider.base_price / 100000).toFixed(1)}M × {item.quantity}
                            </div>
                            <div className="text-white font-semibold text-sm">
                              UGX {(item.provider.base_price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="text-white font-semibold">UGX {totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Service Fee (5%)</span>
                      <span className="text-white">UGX {serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-white/10 pt-3">
                      <span className="text-white font-bold">Total</span>
                      <span className="text-white font-bold">UGX {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {!showCheckout ? (
                    <button
                      onClick={() => setShowCheckout(true)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      <span>Proceed to Book</span>
                    </button>
                  ) : checkoutStep === 'details' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 font-semibold">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Event Date *
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 font-semibold">Additional Notes</label>
                        <textarea
                          value={eventNotes}
                          onChange={(e) => setEventNotes(e.target.value)}
                          placeholder="Special requirements..."
                          className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 transition-all resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCheckout(false)}
                          className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCheckout}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-green-400 font-semibold text-sm mb-1">Review Your Booking</p>
                            <p className="text-green-300 text-xs">
                              Event Date: {new Date(eventDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCheckoutStep('details')}
                          className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCheckout}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all text-sm disabled:opacity-50"
                        >
                          {isLoading ? 'Confirming...' : 'Confirm Booking'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-xs leading-relaxed">
                      <AlertCircle className="w-3 h-3 inline mr-2" />
                      Providers will contact you within 24 hours to confirm availability.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'my-events' && (
        <div className="space-y-6">
          {userEvents.length === 0 ? (
            <div className="text-center py-16 glass-effect rounded-2xl">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
              <p className="text-gray-400 mb-6">Create your first event to get started organizing.</p>
              <button
                onClick={() => setActiveView('create-event')}
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Event</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userEvents.map((event) => (
                <MyEventCard
                  key={event.id}
                  event={event}
                  isLoading={isLoading}
                  onPublish={handlePublishEvent}
                  onEdit={setEditingEvent}
                  onAddServices={(eventId) => {
                    setSelectedEventForBooking(eventId);
                    setActiveView('browse-services');
                  }}
                  onDelete={handleHideEventFromMyEvents}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={loadUserEvents}
          userId={user?.id || ''}
        />
      )}
    </div>
  );
}
