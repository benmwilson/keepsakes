"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';

interface DatabaseConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

interface DatabaseContextType extends DatabaseConnectionState {
  checkConnection: () => Promise<void>;
  retryConnection: () => Promise<void>;
  setConnectionError: (error: string) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [state, setState] = useState<DatabaseConnectionState>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  // Refs for managing intervals and user activity
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isUserActiveRef = useRef<boolean>(false);
  const checkInProgressRef = useRef<boolean>(false);
  const isFormActiveRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);
  const lastCheckedRef = useRef<Date | null>(null);

  const checkConnection = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (checkInProgressRef.current) {
      return;
    }

    checkInProgressRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/database/health-check', {
        method: 'GET',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const now = new Date();
        isConnectedRef.current = data.connected;
        lastCheckedRef.current = now;
        setState({
          isConnected: data.connected,
          isLoading: false,
          error: data.connected ? null : 'Database connection failed',
          lastChecked: now,
        });
      } else {
        const now = new Date();
        isConnectedRef.current = false;
        lastCheckedRef.current = now;
        setState({
          isConnected: false,
          isLoading: false,
          error: 'Failed to check database connection',
          lastChecked: now,
        });
      }
    } catch (error) {
      const now = new Date();
      isConnectedRef.current = false;
      lastCheckedRef.current = now;
      setState({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        lastChecked: now,
      });
    } finally {
      checkInProgressRef.current = false;
    }
  }, []);

  const retryConnection = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  const setConnectionError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      isLoading: false,
      error: error,
      lastChecked: new Date(),
    }));
    isConnectedRef.current = false;
    lastCheckedRef.current = new Date();
  }, []);

  // Simple connection monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const checkInterval = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const timeSinceLastCheck = lastCheckedRef.current ? now - lastCheckedRef.current.getTime() : Infinity;

      // Skip check if user is active or form is active
      if (timeSinceLastActivity < 120000 || isFormActiveRef.current) {
        intervalRef.current = setTimeout(checkInterval, 30000);
        return;
      }

      // Skip check if we just checked recently
      const minInterval = isConnectedRef.current ? 120000 : 30000; // 2 min if connected, 30 sec if not
      if (timeSinceLastCheck < minInterval) {
        intervalRef.current = setTimeout(checkInterval, minInterval - timeSinceLastCheck);
        return;
      }

      // Perform the check
      console.log('Database health check scheduled - connected:', isConnectedRef.current, 'interval:', minInterval);
      checkConnection();
      intervalRef.current = setTimeout(checkInterval, minInterval);
    };

    // Start the monitoring
    intervalRef.current = setTimeout(checkInterval, 30000); // First check after 30 seconds
  }, [checkConnection]);

  // User activity detection
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isUserActiveRef.current = true;
  }, []);

  // Check connection on mount and start monitoring
  useEffect(() => {
    checkConnection();
    startMonitoring();

    // Add user activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden && !isUserActiveRef.current) {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for form activity events
    const handlePauseChecks = () => {
      isFormActiveRef.current = true;
    };
    const handleResumeChecks = () => {
      isFormActiveRef.current = false;
    };

    window.addEventListener('pauseDatabaseChecks', handlePauseChecks);
    window.addEventListener('resumeDatabaseChecks', handleResumeChecks);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pauseDatabaseChecks', handlePauseChecks);
      window.removeEventListener('resumeDatabaseChecks', handleResumeChecks);
    };
  }, []); // Empty dependency array - only run once on mount

  const contextValue: DatabaseContextType = {
    ...state,
    checkConnection,
    retryConnection,
    setConnectionError,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
