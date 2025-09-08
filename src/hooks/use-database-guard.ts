"use client";

import { useDatabase } from '@/lib/database-context';
import { toast } from '@/hooks/use-toast';

export function useDatabaseGuard() {
  const { isConnected, isLoading } = useDatabase();

  const guardAction = (action: () => void | Promise<void>, actionName: string = 'action') => {
    if (isLoading) {
      toast({
        title: "Please wait",
        description: "Checking database connection...",
        variant: "default",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Database Error",
        description: "Unable to perform this action. Database connection is not available.",
        variant: "destructive",
      });
      return;
    }

    action();
  };

  const canPerformAction = !isLoading && isConnected;

  return {
    guardAction,
    canPerformAction,
    isConnected,
    isLoading,
  };
}
