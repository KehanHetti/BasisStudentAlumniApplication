'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Report, DashboardStats } from '@/lib/types';
import { api } from '@/lib/api';
import { FileText, Download, Calendar, Users, BookOpen, TrendingUp, BarChart3, Filter, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<string>('attendance');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData, studentsData, coursesData] = await Promise.all([
        api.getReports(),
        api.getDashboardStats(),
        api.getStudents(),
        api.getCourses(),
      ]);

      setReports(reportsData.results || reportsData);
      setDashboardStats(statsData);
      setStudents(studentsData.results || studentsData);
      setCourses(coursesData.results || coursesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const reportData = {
        report_type: reportType,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        student_id: studentId || undefined,
        course_id: courseId || undefined,
        format: 'json',
      };

      const result = await api.generateReport(reportData);
      console.log('Report generated:', result);
      
      // Refresh reports list
      await loadData();
      
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    if (report.file_path) {
      // In a real app, this would download the actual file
      console.log('Downloading report:', report.file_path);
      alert('Download functionality would be implemented here');
    } else {
      alert('No file available for download');
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Users className="w-5 h-5" />;
      case 'progress':
        return <TrendingUp className="w-5 h-5" />;
      case 'enrollment':
        return <BookOpen className="w-5 h-5" />;
      case 'completion':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'progress':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'enrollment':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completion':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <h1 className="sr-only">Reports & Analytics</h1>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Total Students</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{dashboardStats.students.total}</p>
              </div>
              <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-ui-text-light">
              <span className="font-semibold text-ui-text-light">{dashboardStats.students.active} active</span>
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Active Courses</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{dashboardStats.courses.active}</p>
              </div>
              <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-ui-text-light">
              <span className="font-semibold text-ui-text-light">{dashboardStats.courses.enrollments} enrollments</span>
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Attendance Rate</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{dashboardStats.attendance.percentage}%</p>
              </div>
              <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-ui-text-light">
              <span className="font-semibold text-ui-text-light">{dashboardStats.attendance.present_count} present</span>
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Journal Entries</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{dashboardStats.journals.total_entries}</p>
              </div>
              <div className="p-3 rounded-full bg-logo-primary-blue bg-opacity-10 text-logo-primary-blue">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-ui-text-light">
              <span className="font-semibold text-ui-text-light">{dashboardStats.journals.recent_entries} recent</span>
            </p>
          </Card>
        </div>
      )}

      {/* Generate Report */}
      <Card title="Generate New Report">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            >
              <option value="attendance">Attendance Report</option>
              <option value="progress">Progress Report</option>
              <option value="enrollment">Enrollment Report</option>
              <option value="completion">Completion Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id.toString()}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id.toString()}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <Card title="Generated Reports">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-ui-text-light">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-ui-text-light">
              No reports generated yet.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="border border-ui-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-ui-background">
                      {getReportTypeIcon(report.report_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ui-text-dark">{report.name}</h3>
                      <p className="text-sm text-ui-text-light">
                        {report.description || `Generated ${report.report_type} report`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getReportTypeColor(report.report_type)}`}>
                      {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                    </span>
                    {report.is_public && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Public
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ui-text-light">
                    Generated: {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
                    {report.generated_by && ` • By: ${report.generated_by}`}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadReport(report)}
                      className="inline-flex items-center px-3 py-1 text-sm text-logo-secondary-blue hover:text-logo-primary-blue transition-colors duration-200"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
