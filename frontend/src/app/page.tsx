'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { ArrowUp, Users, Award, BookOpen, CheckSquare, TrendingUp, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats, JournalEntry } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, entriesData] = await Promise.all([
        api.getDashboardStats(),
        api.getJournalEntries({ entry_type: 'progress' }),
      ]);

      setStats(statsData);
      setRecentEntries(entriesData.results || entriesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return `${Math.floor(diffInHours / 168)} weeks ago`;
  };

  return (
    <>
      <h1 className="sr-only">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Total Students</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">
                {loading ? '...' : stats?.students.total || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light flex items-center">
            <ArrowUp className="w-4 h-4 mr-1 text-ui-success" />
            <span className="font-semibold text-ui-success">{stats?.students.active || 0} active</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Graduated Alumni</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">
                {loading ? '...' : stats?.students.graduated || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light flex items-center">
            <ArrowUp className="w-4 h-4 mr-1 text-ui-success" />
            <span className="font-semibold text-ui-success">Success rate</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Active Courses</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">
                {loading ? '...' : stats?.courses.active || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light">
            <span className="font-semibold text-ui-text-light">{stats?.courses.enrollments || 0} enrollments</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Average Attendance</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">
                {loading ? '...' : `${stats?.attendance.percentage || 0}%`}
              </p>
            </div>
            <div className="p-3 rounded-full bg-logo-primary-blue bg-opacity-10 text-logo-primary-blue">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light">
            <span className="font-semibold text-ui-text-light">Last 30 days</span>
          </p>
        </Card>
      </div>

      {/* Main Content Area: Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Attendance Overview (Last 30 Days)">
            <div className="h-72 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border text-ui-text-light">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-logo-secondary-blue" />
                <p className="text-lg font-semibold mb-2">Attendance Analytics</p>
                <p className="text-sm">
                  Total Records: {stats?.attendance.total_records || 0} | 
                  Present: {stats?.attendance.present_count || 0}
                </p>
                <p className="text-xs mt-2 text-ui-text-light">
                  [Chart visualization would be implemented here with a charting library]
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Recent Student Activity">
            {loading ? (
              <div className="text-center py-8 text-ui-text-light">
                Loading recent activity...
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="text-center py-8 text-ui-text-light">
                No recent activity found.
              </div>
            ) : (
              <ul className="space-y-4">
                {recentEntries.slice(0, 5).map((entry, index) => (
                  <li key={entry.id} className="flex items-start text-sm text-ui-text-dark">
                    <span className={`flex-shrink-0 mr-3 ${
                      index === 0 ? 'text-logo-secondary-blue' :
                      index === 1 ? 'text-logo-accent-green' :
                      index === 2 ? 'text-logo-accent-orange' :
                      'text-logo-secondary-blue'
                    }`}>●</span>
                    <div>
                      <span className="font-semibold">{entry.student.full_name}</span> {entry.title.toLowerCase()}
                      {entry.course && (
                        <span className="text-ui-text-light"> in "{entry.course.name}"</span>
                      )}
                      <p className="text-xs text-ui-text-light mt-0.5">
                        {formatDate(entry.created_at)}
                        {entry.created_by && ` • By ${entry.created_by}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card title="Journal Activity">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-logo-primary-blue">{stats?.journals.total_entries || 0}</p>
              <p className="text-sm text-ui-text-light">Total Entries</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light">
            <span className="font-semibold text-ui-text-light">{stats?.journals.recent_entries || 0} recent entries</span>
          </p>
        </Card>

        <Card title="Course Performance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-logo-primary-blue">{stats?.courses.enrollments || 0}</p>
              <p className="text-sm text-ui-text-light">Total Enrollments</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light">
            <span className="font-semibold text-ui-text-light">{stats?.courses.active || 0} active courses</span>
          </p>
        </Card>
      </div>
    </>
  );
}