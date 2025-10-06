// src/app/page.tsx

import Card from '@/components/ui/Card';
import { ArrowUp, Users, Award, BookOpen, CheckSquare } from 'lucide-react'; // Example icons
import Topbar from '@/components/layout/Topbar'; // Import Topbar to set title

export default function DashboardPage() {
  return (
    <>
      {/* Topbar title is managed by RootLayout's Topbar component, but we can pass a prop if needed */}
      {/* If Topbar needs dynamic title per page, it would receive it as a prop from here */}
      <h1 className="sr-only">Dashboard Overview</h1> {/* Hidden for accessibility */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Total Students</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">1,245</p>
            </div>
            <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light flex items-center">
            <ArrowUp className="w-4 h-4 mr-1 text-ui-success" />
            <span className="font-semibold text-ui-success">12% </span> since last month
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Graduated Alumni</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">876</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light flex items-center">
            <ArrowUp className="w-4 h-4 mr-1 text-ui-success" />
            <span className="font-semibold text-ui-success">8%</span> in last quarter
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Active Courses</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">15</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-ui-text-light">
            <span className="font-semibold text-ui-text-light">All programs active</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Average Attendance</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">91.5%</p>
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
          <Card title="Attendance Overview (Last 6 Months)">
            {/* Placeholder for a chart component */}
            <div className="h-72 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border text-ui-text-light">
              <p>[AttendanceChart Component]</p>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Recent Student Activity">
            <ul className="space-y-4">
              <li className="flex items-start text-sm text-ui-text-dark">
                <span className="flex-shrink-0 mr-3 text-logo-secondary-blue">●</span>
                <div>
                  <span className="font-semibold">Aarav Sharma</span> completed "Digital Literacy Module 3".
                  <p className="text-xs text-ui-text-light mt-0.5">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-start text-sm text-ui-text-dark">
                <span className="flex-shrink-0 mr-3 text-logo-accent-green">●</span>
                <div>
                  <span className="font-semibold">Priya Patel</span> had a positive journal entry from Trainer Singh.
                  <p className="text-xs text-ui-text-light mt-0.5">Yesterday</p>
                </div>
              </li>
              <li className="flex items-start text-sm text-ui-text-dark">
                <span className="flex-shrink-0 mr-3 text-logo-accent-orange">●</span>
                <div>
                  <span className="font-semibold">Rohan Singh</span> updated his post-graduation status to "Employed".
                  <p className="text-xs text-ui-text-light mt-0.5">3 days ago</p>
                </div>
              </li>
              <li className="flex items-start text-sm text-ui-text-dark">
                <span className="flex-shrink-0 mr-3 text-logo-secondary-blue">●</span>
                <div>
                  New student <span className="font-semibold">Saanvi Gupta</span> enrolled in "Typing Club".
                  <p className="text-xs text-ui-text-light mt-0.5">1 week ago</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}