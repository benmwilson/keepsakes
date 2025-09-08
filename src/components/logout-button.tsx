'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Optionally redirect to home page
    window.location.href = '/';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline h-auto p-0"
    >
      <LogOut className="mr-1 h-3 w-3" />
      Logout
    </Button>
  );
}
