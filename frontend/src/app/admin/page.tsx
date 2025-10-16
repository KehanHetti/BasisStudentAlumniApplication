'use client';

import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { Users, Key, Shield, BarChart3, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
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

  const adminStats = [
    {
      name: 'Total Users',
      value: '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/users',
    },
    {
      name: 'Course Codes',
      value: '1',
      icon: Key,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/admin/course-codes',
    },
    {
      name: 'Pending Requests',
      value: '0',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/admin/role-requests',
    },
    {
      name: 'System Status',
      value: 'Active',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/settings',
    },
  ];

  const quickActions = [
    {
      name: 'Manage Course Codes',
      description: 'Create and manage registration codes',
      href: '/admin/course-codes',
      icon: Key,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'User Management',
      description: 'View and manage user accounts',
      href: '/admin/users',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Role Requests',
      description: 'Review and approve role changes',
      href: '/admin/role-requests',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'System Settings',
      description: 'Configure system preferences',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-ui-text-dark">
          Admin Dashboard
        </h1>
        <p className="text-ui-text-light mt-2">
          Manage your learning management system
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-ui-text-light">{stat.name}</p>
                  <p className="text-2xl font-bold text-ui-text-dark">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-ui-text-dark mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="p-4 rounded-lg border border-ui-border hover:border-logo-primary-blue hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.bgColor} group-hover:bg-logo-primary-blue group-hover:text-white transition-colors`}>
                  <action.icon className={`h-5 w-5 ${action.color} group-hover:text-white`} />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-ui-text-dark group-hover:text-logo-primary-blue transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-ui-text-light">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-ui-text-dark mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-ui-text-dark">Course Code Created</p>
              <p className="text-sm text-ui-text-light">Computer Science 101 (MRCL29KV)</p>
            </div>
          </div>
          
          <div className="text-center py-8 text-ui-text-light">
            <p>No other recent activity to display</p>
            <p className="text-sm">Admin actions will appear here</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
