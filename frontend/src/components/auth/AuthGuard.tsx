'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Admin routes that require admin role
  const adminRoutes = ['/admin'];
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    if (loading) return;

    // If it's a public route, allow access
    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // If user is authenticated but trying to access auth pages, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      router.push('/dashboard');
      return;
    }

    // Check admin route access
    if (isAuthenticated && isAdminRoute && user) {
      if (user.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }
    }

    // Check role-based access
    if (isAuthenticated && allowedRoles.length > 0 && user) {
      if (!allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }
    }

    setIsChecking(false);
  }, [isAuthenticated, loading, pathname, router, requireAuth, allowedRoles, user, isPublicRoute]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading...</p>
        </div>
      </div>
    );
  }

  // If it's a public route and user is not authenticated, show the page
  if (isPublicRoute && !isAuthenticated) {
    return <>{children}</>;
  }

  // If authentication is required and user is not authenticated, don't render
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If role-based access is required and user doesn't have the right role
  if (isAuthenticated && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
