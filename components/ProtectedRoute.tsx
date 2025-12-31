'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // In demo mode, allow access without authentication
    if (isDemoMode) {
      return;
    }
    
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, isDemoMode]);

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  // In demo mode, always allow access
  if (isDemoMode) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
