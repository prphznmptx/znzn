import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
});

export interface Profile {
  id: string;
  name: string;
  email: string;
  account_type: 'creator' | 'member';
  tier: 'free' | 'premium' | 'professional' | 'elite';
  loyalty_points: number;
  avatar_url: string | null;
  bio: string | null;
  joined_date: string;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  creator: string;
  description: string | null;
  type: string;
  category: string | null;
  thumbnail_url: string;
  duration: string | null;
  read_time: string | null;
  views_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface MediaLike {
  id: string;
  user_id: string;
  media_id: string;
  created_at: string;
}

export interface CreatorFollow {
  id: string;
  follower_id: string;
  creator_name: string;
  created_at: string;
}

export interface Tip {
  id: string;
  from_user_id: string | null;
  creator_name: string;
  amount: number;
  currency: string;
  message: string | null;
  created_at: string;
}

export interface VideoUpload {
  id: string;
  user_id: string;
  filename: string;
  b2_url: string;
  asset_id: string | null;
  playback_id: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  final_content_id: string | null;
}
