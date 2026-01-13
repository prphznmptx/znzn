export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'social' | 'networking' | 'business' | 'workshop' | 'conference' | 'entertainment';
  event_date: string;
  event_time: string;
  location: string;
  organizer_id: string;
  organizer_name: string;
  organizer_specification?: string;
  organizer_avatar?: string;
  image_url?: string;
  thumbnail_url?: string;
  price: number;
  capacity: number;
  attendees_count: number;
  rating: number;
  reviews_count: number;
  attractions: string[];
  features: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_livestream: boolean;
  livestream_url?: string;
  is_published: boolean;
  is_visible_in_join_tab: boolean;
  is_visible_in_my_events: boolean;
  published_at?: string;
  deleted_from_join_tab_at?: string;
  deleted_from_my_events_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EventMemory {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  image_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventComment {
  id: string;
  memory_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: 'venue' | 'catering' | 'decor' | 'audio' | 'photography' | 'entertainment' | 'security' | 'transport' | 'ushering';
  description: string;
  expertise: string;
  base_price: number;
  rating: number;
  reviews_count: number;
  contact_email: string;
  contact_phone: string;
  portfolio_images: string[];
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventServiceBooking {
  id: string;
  event_id: string;
  user_id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string;
  quantity: number;
  base_price: number;
  total_price: number;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventFormData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  estimatedGuests: number;
  budget: number;
  organizerSpecification: string;
  attractions: string;
  features: string[];
  isLivestream: boolean;
  livestreamLink?: string;
}

export interface EventBooking {
  id: string;
  event_id: string;
  organizer_id: string;
  event_name: string;
  event_date: string;
  services: Array<{
    provider_id: string;
    provider_name: string;
    category: string;
    quantity: number;
    unit_price: number;
  }>;
  total_cost: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}
