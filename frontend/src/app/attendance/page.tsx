'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import type { Student, Attendance, Course, AttendanceStats } from '@/lib/types';
import { api } from '@/lib/api';
import { extractArrayFromResponse } from '@/lib/apiHelpers';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Filter, Download, Plus, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedStudent, selectedCourse, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData, attendanceData, statsData] = await Promise.all([
        api.getStudents(),
        api.getCourses(),
        api.getAttendance({
          student_id: selectedStudent || undefined,
          course_id: selectedCourse || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        api.getAttendanceStats({
          student_id: selectedStudent || undefined,
          course_id: selectedCourse || undefined,
          days: 30,
        }),
      ]);

      const studentsArray = extractArrayFromResponse<Student>(studentsData as Student[] | { results: Student[] });
      // Filter out alumni from student list for attendance
      const activeStudents = studentsArray.filter((s: Student) => 
        s.status !== 'alumni'
      );
      setStudents(activeStudents);
      const coursesArray = extractArrayFromResponse<Course>(coursesData as Course[] | { results: Course[] });
      setCourses(coursesArray);
      const attendanceArray = extractArrayFromResponse<Attendance>(attendanceData as Attendance[] | { results: Attendance[] });
      setAttendance(attendanceArray);
      setStats(statsData as AttendanceStats);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'absent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'late':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'excused':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const setPresetDateRange = (preset: 'today' | 'week' | 'month') => {
    const today = new Date();
    let fromDate = '';
    let toDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        fromDate = toDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        fromDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        fromDate = monthAgo.toISOString().split('T')[0];
        break;
    }

    setDateFrom(fromDate);
    setDateTo(toDate);
  };

  const exportAttendance = () => {
    // Simple CSV export
    const csvContent = [
      ['Student', 'Course', 'Date', 'Status', 'Notes'],
      ...attendance.map(record => [
        record.student.full_name,
        record.course.name,
        new Date(record.date).toLocaleDateString(),
        record.status,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1 className="sr-only">Attendance Management</h1>

      {/* Stats Cards with Enhanced Design */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Records</p>
                <p className="text-3xl font-extrabold text-blue-700">{stats.total_attendance}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Present</p>
                <p className="text-3xl font-extrabold text-green-700">{stats.present_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Absent</p>
                <p className="text-3xl font-extrabold text-red-700">{stats.absent_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500 shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Attendance Rate</p>
                <p className="text-3xl font-extrabold text-purple-700">{stats.attendance_percentage}%</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card title="Attendance Records">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4 sm:mb-6 items-start sm:items-center">
          <Link
            href="/attendance/mark"
            className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 shadow-md touch-target w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mark Attendance
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-ui-text-light font-semibold">Quick filters:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPresetDateRange('today')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-200 hover:border-blue-400 transition-all shadow-sm touch-target"
              >
                Today
              </button>
              <button
                onClick={() => setPresetDateRange('week')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-200 hover:border-blue-400 transition-all shadow-sm touch-target"
              >
                This Week
              </button>
              <button
                onClick={() => setPresetDateRange('month')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-200 hover:border-blue-400 transition-all shadow-sm touch-target"
              >
                Last Month
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-ui-border">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id.toString()}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id.toString()}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-ui-text-light flex-shrink-0" />
            <label className="sr-only">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border-2 border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-logo-secondary-blue bg-white text-ui-text-dark font-medium"
              aria-label="Select start date"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="sr-only">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border-2 border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-logo-secondary-blue bg-white text-ui-text-dark font-medium"
              aria-label="Select end date"
            />
          </div>

          <button
            onClick={exportAttendance}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-ui-border min-w-[600px]">
            <thead className="bg-ui-background sticky top-0 z-10">
              <tr>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Student
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Course
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider hidden md:table-cell">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border bg-ui-card-background">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ui-text-light">
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState
                      icon={Calendar}
                      title="No attendance records found"
                      description="Start tracking student engagement by marking attendance. Click the button below to record your first attendance entry."
                      action={{
                        label: 'Mark Attendance',
                        onClick: () => window.location.href = '/attendance/mark',
                      }}
                    />
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-ui-background transition-colors duration-150">
                    <td className="whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium text-ui-text-dark">
                      {record.student.full_name}
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light">
                      {record.course.name}
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light hidden md:table-cell">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
