'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Report, DashboardStats } from '@/lib/types';
import { api } from '@/lib/api';
import { FileText, Download, Calendar, Users, BookOpen, TrendingUp, BarChart3, Filter, RefreshCw, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['recent']));
  const [deleteConfirm, setDeleteConfirm] = useState<Report | null>(null);
  const { showToast } = useToast();

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
        format: 'pdf',
      };

      const result = await api.generateReport(reportData);
      
      // Refresh reports list
      await loadData();
      
      showToast('Report generated successfully!', 'success');
    } catch (error) {
      showToast('Error generating report. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (report: Report) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/reports/${report.id}/download/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `report_${report.id}_${new Date().getTime()}.${report.file_path?.split('.').pop() || 'json'}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Report downloaded successfully!', 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to download report', 'error');
      }
    } catch (error) {
      showToast('Error downloading report. Please try again.', 'error');
    }
  };

  const handleDeleteClick = (report: Report) => {
    setDeleteConfirm(report);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.deleteReport(deleteConfirm.id.toString());
      await loadData(); // Refresh the reports list
      showToast('Report deleted successfully!', 'success');
      setDeleteConfirm(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete report. Please try again.', 'error');
      setDeleteConfirm(null);
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

  const groupReportsByDate = () => {
    const now = new Date();
    const groups: { [key: string]: Report[] } = {
      recent: [],
      thisMonth: [],
      older: [],
    };

    reports.forEach((report) => {
      const reportDate = new Date(report.generated_at);
      const diffDays = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        groups.recent.push(report);
      } else if (diffDays <= 30) {
        groups.thisMonth.push(report);
      } else {
        groups.older.push(report);
      }
    });

    return groups;
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  return (
    <>
      <h1 className="sr-only">Reports & Analytics</h1>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
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

      {/* Generate Report with Enhanced Design */}
      <Card className="bg-gradient-to-br from-white to-blue-50/30">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-logo-primary-blue to-logo-secondary-blue rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-ui-text-dark">Generate New Report</h2>
          </div>
          <p className="text-sm text-ui-text-light ml-12">
            Create comprehensive reports showing attendance trends, engagement metrics, and classroom insights.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
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
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
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
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
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
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-light mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white font-bold rounded-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Reports List with Grouping */}
      <Card title="Generated Reports">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-logo-secondary-blue"></div>
            <p className="mt-4 text-ui-text-light">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports generated yet"
            description="Generate your first report to see attendance trends, engagement metrics, and classroom insights. Use the form above to create a custom report."
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupReportsByDate()).map(([groupKey, groupReports]) => {
              if (groupReports.length === 0) return null;
              
              const groupLabels: { [key: string]: string } = {
                recent: 'Last 7 Days',
                thisMonth: 'This Month',
                older: 'Older Reports',
              };
              
              const isExpanded = expandedGroups.has(groupKey);
              
              return (
                <div key={groupKey} className="border border-ui-border rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-logo-secondary-blue/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-logo-secondary-blue" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-ui-text-dark">{groupLabels[groupKey]}</h3>
                        <p className="text-xs text-ui-text-light">{groupReports.length} report{groupReports.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-ui-text-light" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ui-text-light" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 space-y-3 border-t border-ui-border bg-white">
                      {groupReports.map((report) => (
                        <div key={report.id} className="border border-ui-border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50/50 group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`p-3 rounded-xl shadow-md ${getReportTypeColor(report.report_type)}`}>
                                {getReportTypeIcon(report.report_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-ui-text-dark mb-1 group-hover:text-logo-secondary-blue transition-colors">
                                  {report.name}
                                </h3>
                                <p className="text-sm text-ui-text-light">
                                  {report.description || `Generated ${report.report_type} report`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getReportTypeColor(report.report_type)}`}>
                                {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                              </span>
                              {report.is_public && (
                                <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-ui-border">
                            <p className="text-xs text-ui-text-light">
                              <span className="font-medium">Generated:</span> {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
                              {report.generated_by && ` • By: ${report.generated_by}`}
                            </p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => downloadReport(report)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-logo-secondary-blue hover:text-white hover:bg-logo-secondary-blue rounded-lg transition-all duration-200"
                                title="Download report"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </button>
                              <button
                                onClick={() => handleDeleteClick(report)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200"
                                title="Delete report"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and will also delete the associated file.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}
