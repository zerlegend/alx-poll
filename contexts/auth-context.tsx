'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

// Types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<AuthResult>;
}

interface AuthResult {
  success: boolean;
  error: string | null;
  data?: {
    user: User | null;
    session: Session | null;
  };
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error),
        };
      }

      return {
        success: true,
        error: null,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long',
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error),
        };
      }

      return {
        success: true,
        error: null,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw new Error('Failed to sign out');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      throw error;
    }
  }, []);

  // Resend confirmation email
  const resendConfirmationEmail = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email is required',
        };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error),
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('Unexpected error resending confirmation:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }, []);

  // Helper function to get user-friendly error messages
  const getAuthErrorMessage = (error: AuthError): string => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link';
      case 'User already registered':
        return 'An account with this email already exists';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address';
      default:
        return error.message || 'An error occurred during authentication';
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}