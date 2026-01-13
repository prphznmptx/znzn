import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';

export const TIER_POINTS = {
  free: 0,
  premium: 500,
  professional: 1500,
  elite: 3000,
};

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'member';
  tier: 'free' | 'premium' | 'professional' | 'elite';
  loyaltyPoints: number;
  joined_date: string;
  profileImage?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: any | null;
  loading: boolean;
  signUp: (formData: { name: string; email: string; password: string; accountType: 'creator' | 'member' }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (profileData) {
      const authUser: AuthUser = {
        id: userId,
        email: profileData.email,
        name: profileData.name,
        role: profileData.account_type as 'creator' | 'member',
        tier: profileData.tier as 'free' | 'premium' | 'professional' | 'elite',
        loyaltyPoints: profileData.loyalty_points || 0,
        joined_date: profileData.joined_date,
        profileImage: profileData.avatar_url,
      };

      setProfile(profileData);
      setUser(authUser);
      return authUser;
    }

    return null;
  };

  const signUp = async (formData: { name: string; email: string; password: string; accountType: 'creator' | 'member' }) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            account_type: formData.accountType,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        await fetchUserData(data.user.id);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        return await fetchUserData(data.user.id);
      }

      return null;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
