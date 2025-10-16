'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-ui-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-ui-text-dark mb-2">Access Denied</h2>
            <p className="text-ui-text-light mb-6">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-logo-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Link>
              
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-ui-border text-ui-text-dark rounded-lg hover:bg-ui-background transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
