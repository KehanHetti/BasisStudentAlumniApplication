'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { CheckCircle, XCircle, Clock, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Course, Enrollment, Classroom, Student as StudentType } from '@/lib/types';

interface CourseWithStudents {
  id: number;
  name: string;
  students: Array<{
    id: number;
    full_name: string;
    email: string;
    phone: string;
    status: string;
  }>;
  displayCount?: number; // For showing the count from API
  batch_number?: number;
  student_count?: number;
}

interface AttendanceRecord {
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export default function MarkAttendancePage() {
  const [courses, setCourses] = useState<CourseWithStudents[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStudents | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Use Classrooms instead of Courses
      const classroomsData = await api.getClassrooms() as Classroom[] | { results?: Classroom[] };
      const classroomsArray = Array.isArray(classroomsData) ? classroomsData : (classroomsData.results || []);
      
      // Get all students to match with classrooms
      const studentsData = await api.getStudents({ all: true }) as StudentType[] | { results?: StudentType[] };
      const studentsArray = Array.isArray(studentsData) ? studentsData : (studentsData.results || []);
      
      // Group students by classroom
      // Use student_count from API (same as course management page)
      // All students are current - no need to filter by status
      const coursesWithStudents: CourseWithStudents[] = classroomsArray.map(classroom => {
        const classroomStudents = studentsArray
          .filter((student: StudentType) => 
            student.classroom === classroom.id
          )
          .map((student: StudentType) => ({
            id: student.id,
            full_name: student.full_name,
            email: student.email,
            phone: student.phone,
            status: student.status
          }));
        
        return {
          id: classroom.id,
          name: classroom.name + (classroom.batch_number ? ` - Batch ${classroom.batch_number}` : ''),
          description: '',
          level: 'beginner' as const,
          duration_weeks: 0,
          max_students: 0,
          status: 'active' as const,
          created_at: '',
          updated_at: '',
          students: classroomStudents,
          // Use the student_count from API to match course management page
          displayCount: classroom.student_count || classroomStudents.length
        };
      });
      
      setCourses(coursesWithStudents);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id.toString() === courseId);
    setSelectedCourse(course || null);
    
      // Initialize attendance records for all students in the course
      if (course) {
        const initialRecords: Record<number, AttendanceRecord> = {};
        course.students.forEach(student => {
          initialRecords[student.id] = {
            student_id: student.id,
            status: 'present', // Default to present
            notes: ''
          };
        });
        setAttendanceRecords(initialRecords);
      }
  };

  const updateAttendanceStatus = (studentId: number, status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const updateAttendanceNotes = (studentId: number, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const saveAttendance = async () => {
    if (!selectedCourse) return;

    try {
      setSaving(true);
      setMessage(null);

      // Create attendance records for all students
      const attendanceData = Object.values(attendanceRecords).map(record => ({
        student_id: record.student_id,
        classroom_id: selectedCourse.id, // Use classroom_id instead of course_id
        date: attendanceDate,
        status: record.status,
        notes: record.notes || ''
      }));

      // Save each attendance record
      for (const record of attendanceData) {
        await api.createAttendance(record);
      }

      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      
      // Reset form
      setSelectedCourse(null);
      setAttendanceRecords({});
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'absent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'late':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'excused':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ui-text-dark">Mark Attendance</h1>
          <p className="text-ui-text-light mt-1">Select a course and mark student attendance</p>
        </div>
        <Link
          href="/attendance"
          className="flex items-center gap-2 px-4 py-2 text-ui-text-light hover:text-ui-text-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Course Selection */}
      <Card title="Select Course">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ui-text-dark mb-2">
              Course
            </label>
            <select
              value={selectedCourse?.id.toString() || ''}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
            >
              <option value="">Select a course...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id.toString()}>
                  {course.name} ({course.displayCount ?? course.students.length} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-dark mb-2">
              Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Attendance Marking */}
      {selectedCourse && (
        <Card title={`Mark Attendance - ${selectedCourse.name}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ui-text-light">
                {selectedCourse.students.length} students enrolled
              </p>
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-logo-primary-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            <div className="space-y-3">
              {selectedCourse.students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-4 border border-ui-border rounded-lg hover:bg-ui-background transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-ui-text-dark">{student.full_name}</h3>
                    <p className="text-sm text-ui-text-light">{student.email}</p>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-2">
                    {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updateAttendanceStatus(student.id, status)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          attendanceRecords[student.id]?.status === status
                            ? getStatusColor(status)
                            : 'bg-white border-ui-border text-ui-text-light hover:bg-ui-background'
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="w-64">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={attendanceRecords[student.id]?.notes || ''}
                      onChange={(e) => updateAttendanceNotes(student.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
