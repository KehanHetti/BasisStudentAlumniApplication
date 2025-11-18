'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking authentication and redirecting
  return (
    <div className="min-h-screen bg-ui-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
        <p className="text-ui-text-light">Loading...</p>
      </div>
    </div>
  );
}