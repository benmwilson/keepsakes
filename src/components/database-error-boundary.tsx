"use client";

import React, { useEffect } from 'react';
import { useDatabase } from '@/lib/database-context';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface DatabaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showOnSetupPage?: boolean;
}

export function DatabaseErrorBoundary({ 
  children, 
  fallback,
  showOnSetupPage = false 
}: DatabaseErrorBoundaryProps) {
  const { isConnected, isLoading, error, retryConnection } = useDatabase();

  // Update document title based on connection status
  const getTitle = () => {
    if (isLoading) {
      return "Keepsakes - Checking Connection...";
    } else if (!isConnected && !showOnSetupPage) {
      return "⚠️ Keepsakes - Database Connection Error";
    } else if (!isConnected && showOnSetupPage) {
      return "🔧 Keepsakes - Database Setup Required";
    } else {
      return "Keepsakes";
    }
  };

  useDocumentTitle({ title: getTitle() });

  // If we're loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Database className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Checking database connection...</p>
        </div>
      </div>
    );
  }

  // If there's no connection and we're not on setup page, show error
  if (!isConnected && !showOnSetupPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Database Connection Error</h1>
            <p className="text-muted-foreground">
              Unable to connect to the database. Please check your configuration and try again.
            </p>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Database connection failed'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={retryConnection} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>If this problem persists, please contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's no connection and we're on setup page, show setup-specific error
  if (!isConnected && showOnSetupPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <Database className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Database Setup Required</h1>
            <p className="text-muted-foreground">
              Please ensure your database is running and properly configured before proceeding with setup.
            </p>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Database connection failed'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={retryConnection} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Database Connection
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Make sure your database server is running and the connection details are correct.</p>
          </div>
        </div>
      </div>
    );
  }

  // If connected, render children or fallback
  return <>{children}</>;
}
