'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// TODO: Replace with actual auth configuration
// import { AUTH_CONFIG, getSitePassword, getPasswordProtectionStatus } from './auth-config';

interface AuthContextType {
  isAuthenticated: boolean;
  isPasswordProtectionEnabled: boolean;
  authenticate: (password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password is now configured in auth-config.ts

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordProtectionEnabled, setIsPasswordProtectionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthStatus = async () => {
    try {
      // TODO: Replace with actual database check
      // const protectionEnabled = await getPasswordProtectionStatus();
      const protectionEnabled = false; // Mock: disable password protection for testing
      setIsPasswordProtectionEnabled(protectionEnabled);

      // If password protection is disabled, automatically authenticate
      if (!protectionEnabled) {
        setIsAuthenticated(true);
      } else {
        // Check if user is already authenticated on mount
        const authStatus = localStorage.getItem('keepsakes-auth');
        if (authStatus === 'true') {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error refreshing auth status:', error);
      // Fallback: assume password protection is disabled
      setIsPasswordProtectionEnabled(false);
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshAuthStatus();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const authenticate = async (password: string): Promise<boolean> => {
    try {
      const sitePassword = await getSitePassword();
      if (password === sitePassword) {
        setIsAuthenticated(true);
        localStorage.setItem('keepsakes-auth', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      // Fallback to environment variable
      if (password === AUTH_CONFIG.SITE_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem('keepsakes-auth', 'true');
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('keepsakes-auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isPasswordProtectionEnabled, 
      authenticate, 
      logout,
      refreshAuthStatus 
    }}>
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
