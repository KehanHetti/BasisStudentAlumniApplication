'use client';

import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { Users, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Check if user is admin or teacher
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ui-text-dark mb-4">Access Denied</h1>
          <p className="text-ui-text-light">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      name: 'Manage Courses',
      description: 'Add new courses to the database',
      href: '/admin/courses',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Manage Students',
      description: 'Add students or assign them to classes',
      href: '/students',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-ui-text-dark">
          Administration
        </h1>
        <p className="text-ui-text-light mt-2">
          Manage courses and students
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-ui-text-dark mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="p-6 rounded-lg border border-ui-border hover:border-logo-primary-blue hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${action.bgColor} group-hover:bg-logo-primary-blue group-hover:text-white transition-colors`}>
                  <action.icon className={`h-6 w-6 ${action.color} group-hover:text-white`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-ui-text-dark group-hover:text-logo-primary-blue transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-ui-text-light mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
