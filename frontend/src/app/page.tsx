'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { BookOpen, Users, BarChart3, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-ui-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-ui-text-dark sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Basis Learning</span>{' '}
                  <span className="block text-logo-primary-blue xl:inline">Tracker</span>
                </h1>
                <p className="mt-3 text-base text-ui-text-light sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  A comprehensive learning management system for educational institutions to manage students, 
                  courses, attendance, and progress tracking with secure role-based access.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/auth/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-logo-primary-blue hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/auth/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-logo-primary-blue bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-logo-primary-blue font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-ui-text-dark sm:text-4xl">
              Everything you need to manage learning
            </p>
            <p className="mt-4 max-w-2xl text-xl text-ui-text-light lg:mx-auto">
              Comprehensive tools for students, teachers, and administrators
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-logo-primary-blue text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-ui-text-dark">Student Management</p>
                <p className="mt-2 ml-16 text-base text-ui-text-light">
                  Complete student profiles with contact information, status tracking, and enrollment management.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-logo-primary-blue text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-ui-text-dark">Course Management</p>
                <p className="mt-2 ml-16 text-base text-ui-text-light">
                  Create and manage courses with different levels and track student enrollments.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-logo-primary-blue text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-ui-text-dark">Attendance Tracking</p>
                <p className="mt-2 ml-16 text-base text-ui-text-light">
                  Easy course-based attendance marking with interactive charts and analytics.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-logo-primary-blue text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-ui-text-dark">Secure Access</p>
                <p className="mt-2 ml-16 text-base text-ui-text-light">
                  Role-based authentication with course codes for secure access control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-logo-primary-blue">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Sign in to your account.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Access your learning management system with secure authentication.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-logo-primary-blue bg-white hover:bg-gray-50 sm:w-auto transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    </div>
  );
}