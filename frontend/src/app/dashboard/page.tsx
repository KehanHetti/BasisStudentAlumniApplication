'use client';

import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import AttendanceChart from '@/components/charts/AttendanceChart';
import { Users, BookOpen, Calendar, BarChart3, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Students',
      value: '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Courses',
      value: '0',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Today\'s Attendance',
      value: '0',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Attendance Rate',
      value: '0%',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    {
      name: 'Mark Attendance',
      description: 'Record attendance for courses',
      href: '/attendance/mark',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'View Students',
      description: 'Manage student information',
      href: '/students',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'View Reports',
      description: 'Generate attendance reports',
      href: '/reports',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'View Journals',
      description: 'Check student journals',
      href: '/journals',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-ui-text-dark">
          Welcome back, {user?.first_name || 'User'}!
        </h1>
        <p className="text-ui-text-light mt-2">
          Here's what's happening with your learning management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
              </div>
              <div className="ml-3 md:ml-4 min-w-0">
                <p className="text-xs md:text-sm font-medium text-ui-text-light truncate">{stat.name}</p>
                <p className="text-lg md:text-2xl font-bold text-ui-text-dark">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-ui-text-dark">Attendance Overview</h2>
            <Link
              href="/attendance"
              className="text-xs md:text-sm text-logo-primary-blue hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="overflow-hidden">
            <AttendanceChart />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg md:text-xl font-semibold text-ui-text-dark mb-4 md:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="p-3 md:p-4 rounded-lg border border-ui-border hover:border-logo-primary-blue hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${action.bgColor} group-hover:bg-logo-primary-blue group-hover:text-white transition-colors`}>
                    <action.icon className={`h-4 w-4 md:h-5 md:w-5 ${action.color} group-hover:text-white`} />
                  </div>
                  <div className="ml-3 min-w-0">
                    <h3 className="text-sm md:text-base font-medium text-ui-text-dark group-hover:text-logo-primary-blue transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-xs md:text-sm text-ui-text-light">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-ui-text-dark mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-ui-text-dark">System Initialized</p>
              <p className="text-sm text-ui-text-light">Welcome to Basis Learning Tracker</p>
            </div>
          </div>
          
          <div className="text-center py-8 text-ui-text-light">
            <p>No recent activity to display</p>
            <p className="text-sm">Start by marking attendance or adding students</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
