'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import ImpactVisualizations from '@/components/charts/ImpactVisualizations';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { Users, BookOpen, Calendar, BarChart3, Clock, CheckCircle, GraduationCap, TrendingUp, Target, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    alumniCount: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesData, statsData] = await Promise.all([
        api.getCourses(),
        api.getStudentStats(),
      ]);

      setStats({
        totalStudents: statsData.total_students || 0,
        activeStudents: statsData.active_students || 0,
        alumniCount: statsData.alumni_students || 0,
        totalCourses: Array.isArray(coursesData) ? coursesData.length : (coursesData?.results?.length || 0),
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      name: 'Active Students',
      value: stats.activeStudents.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      href: '/students?status=active',
    },
    {
      name: 'Alumni',
      value: stats.alumniCount.toString(),
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
      href: '/students?status=alumni',
    },
    {
      name: 'Total Courses',
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-500',
      href: '/admin/courses',
    },
    {
      name: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      iconBg: 'bg-orange-500',
      href: '/students',
    },
  ];

  const quickActions = [
    {
      name: 'Mark Attendance',
      description: 'Record attendance for courses',
      href: '/attendance/mark',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      hoverColor: 'hover:from-blue-100 hover:to-blue-200',
    },
    {
      name: 'View Students',
      description: 'Manage student information',
      href: '/students',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      hoverColor: 'hover:from-green-100 hover:to-green-200',
    },
    {
      name: 'View Reports',
      description: 'Generate attendance reports',
      href: '/reports',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      hoverColor: 'hover:from-purple-100 hover:to-purple-200',
    },
    {
      name: 'View Journals',
      description: 'Check student journals',
      href: '/journals',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      hoverColor: 'hover:from-orange-100 hover:to-orange-200',
    },
  ];

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-logo-primary-blue via-logo-secondary-blue to-blue-600 p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-white/90 text-xs sm:text-sm font-medium truncate">{todayFormatted}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                Welcome back, {user?.first_name || 'User'}! 👋
              </h1>
              <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl">
                Here's what's happening with your learning management system today.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-white/90 text-xs font-medium uppercase tracking-wide mb-1">Today at a glance</span>
                <span className="text-white text-2xl sm:text-3xl font-bold">{stats.activeStudents} Active</span>
                <span className="text-white/80 text-sm sm:text-base font-medium mt-1">Students</span>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {dashboardStats.map((stat) => (
          <Link key={stat.name} href={stat.href || '#'} className="block group">
            <Card className="hover:scale-[1.02] transition-transform duration-300 border-2 hover:border-logo-secondary-blue">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-ui-text-light truncate mb-1">{stat.name}</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-ui-text-dark">{stat.value}</p>
                </div>
                <div className={`p-3 md:p-4 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <stat.icon className={`h-6 w-6 md:h-7 md:w-7 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-ui-text-light group-hover:text-logo-secondary-blue transition-colors">
                <span>View details</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Impact Visualizations with Enhanced Card */}
        <Card className="bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-ui-text-dark mb-1">Impact Overview</h2>
              <p className="text-sm text-ui-text-light">Track key metrics and trends</p>
            </div>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1 text-sm text-logo-secondary-blue hover:text-logo-primary-blue font-semibold transition-colors"
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm p-4 min-h-[400px]">
            <ImpactVisualizations />
          </div>
        </Card>

        {/* Quick Actions with Enhanced Design */}
        <Card className="bg-gradient-to-br from-white to-purple-50/30">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-ui-text-dark mb-1">Quick Actions</h2>
            <p className="text-sm text-ui-text-light">Common tasks and shortcuts</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`group relative p-5 sm:p-6 rounded-xl border-2 border-ui-border ${action.bgColor} ${action.hoverColor} transition-all duration-300 hover:shadow-xl hover:border-logo-secondary-blue hover:-translate-y-1 min-h-[120px] sm:min-h-[140px] flex flex-col`}
              >
                <div className="flex items-start gap-4 h-full">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                    <action.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-ui-text-dark mb-2 group-hover:text-logo-secondary-blue transition-colors">
                        {action.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-ui-text-light leading-relaxed">{action.description}</p>
                    </div>
                    <div className="mt-3 flex items-center text-logo-secondary-blue opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-semibold mr-2">Go</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity with Enhanced Design */}
      <Card className="bg-gradient-to-br from-white to-gray-50/50">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-ui-text-dark mb-1">Recent Activity</h2>
          <p className="text-sm text-ui-text-light">Latest updates and events</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 shadow-sm">
            <div className="p-3 bg-blue-500 rounded-xl shadow-md">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ui-text-dark">System Initialized</p>
              <p className="text-sm text-ui-text-light">Welcome to Basis Learning Tracker</p>
            </div>
            <span className="text-xs text-ui-text-light bg-white/80 px-3 py-1 rounded-full">
              Just now
            </span>
          </div>
          
          <EmptyState
            icon={Target}
            title="No recent activity"
            description="Start by marking attendance, adding students, or creating journal entries to see activity here."
            action={{
              label: 'Mark Attendance',
              onClick: () => window.location.href = '/attendance/mark',
            }}
          />
        </div>
      </Card>
    </div>
  );
}
