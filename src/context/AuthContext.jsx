import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile
  const loadUserProfile = async (userId, userMetadata = {}) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Fallback or self-created profile if trigger hasn't fired yet
        const defaultProfile = {
          id: userId,
          user_id: userId,
          display_name: userMetadata.full_name || userMetadata.name || 'Family Historian',
          avatar_url: userMetadata.avatar_url || null,
        };
        setProfile(defaultProfile);
      }
    } catch (e) {
      console.warn('Profile load notice:', e);
      setProfile({
        id: userId,
        user_id: userId,
        display_name: userMetadata.full_name || 'Family Historian',
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          const currentSession = data?.session || null;
          setSession(currentSession);
          const currentUser = currentSession?.user || null;
          setUser(currentUser);
          if (currentUser) {
            await loadUserProfile(currentUser.id, currentUser.user_metadata);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const currentUser = newSession?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.id, currentUser.user_metadata);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const next = {
      ...profile,
      display_name: updates.displayName !== undefined ? updates.displayName : profile?.display_name,
      avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : profile?.avatar_url,
    };
    setProfile(next);

    try {
      await supabase.from('profiles').update({
        display_name: next.display_name,
        avatar_url: next.avatar_url,
      }).eq('id', user.id);
    } catch (e) {
      console.warn('Profile update notice:', e);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
