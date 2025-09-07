'use client';

import { useAuth } from '@/lib/auth-context';
import PasswordProtection from './password-protection';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PasswordProtection />;
  }

  return <>{children}</>;
}
