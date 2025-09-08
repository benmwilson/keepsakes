'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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
      // Check password protection status via API
      const response = await fetch('/api/auth/protection-status');
      if (response.ok) {
        const result = await response.json();
        const protectionEnabled = result.enabled;
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
      } else {
        // Fallback: assume password protection is disabled
        setIsPasswordProtectionEnabled(false);
        setIsAuthenticated(true);
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
      // Call server action to verify password
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsAuthenticated(true);
          localStorage.setItem('keepsakes-auth', 'true');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
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
