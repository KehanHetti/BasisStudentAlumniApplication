'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Student, Attendance, Course, AttendanceStats } from '@/lib/types';
import { api } from '@/lib/api';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Filter, Download } from 'lucide-react';

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

      setStudents(studentsData.results || studentsData);
      setCourses(coursesData.results || coursesData);
      setAttendance(attendanceData.results || attendanceData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Total Records</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{stats.total_attendance}</p>
              </div>
              <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Present</p>
                <p className="text-3xl font-extrabold text-green-600 mt-1">{stats.present_count}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Absent</p>
                <p className="text-3xl font-extrabold text-red-600 mt-1">{stats.absent_count}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-light">Attendance Rate</p>
                <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{stats.attendance_percentage}%</p>
              </div>
              <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card title="Attendance Records">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
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
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
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
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
              placeholder="From Date"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
              placeholder="To Date"
            />
          </div>

          <button
            onClick={exportAttendance}
            className="inline-flex items-center px-4 py-2 bg-logo-accent-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ui-border">
            <thead className="bg-ui-background">
              <tr>
                <th className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Student
                </th>
                <th className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Course
                </th>
                <th className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">
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
                  <td colSpan={5} className="py-8 text-center text-ui-text-light">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-ui-background transition-colors duration-150">
                    <td className="whitespace-nowrap py-4 px-4 text-sm font-medium text-ui-text-dark">
                      {record.student.full_name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">
                      {record.course.name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-ui-text-light">
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
