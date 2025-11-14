'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Student, Course, Enrollment } from '@/lib/types';
import { api } from '@/lib/api';
import { GraduationCap, BookOpen, TrendingUp, Award, Edit, Save, X, Filter, Plus, UserPlus, FileText, Calendar, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

interface Classroom {
  id: number;
  name: string;
  batch_number?: number;
  student_count: number;
}

export default function ProgressPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ grade: '', is_completed: false, notes: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedStudent, selectedClassroom, selectedCourse]);

  // Filter students based on selected classroom
  useEffect(() => {
    if (!allStudents.length) return; // Wait for students to load
    
    if (selectedClassroom) {
      // Filter students by classroom (same logic as course management page)
      const filteredStudents = allStudents.filter(student => 
        student.classroom?.toString() === selectedClassroom
      );
      
      setStudents(filteredStudents);
      
      // Reset selected student if they're not in the filtered list
      if (selectedStudent && !filteredStudents.find(s => s.id.toString() === selectedStudent)) {
        setSelectedStudent('');
      }
    } else {
      // No classroom selected, show all students
      setStudents(allStudents);
    }
  }, [selectedClassroom, allStudents, selectedStudent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classroomsData, coursesData, enrollmentsData] = await Promise.all([
        api.getStudents({ all: true }),
        api.getClassrooms(),
        api.getCourses(),
        api.getEnrollments({
          student_id: selectedStudent || undefined,
          course_id: selectedCourse || undefined,
        }),
      ]);

      const studentsArray = Array.isArray(studentsData) ? studentsData : (studentsData?.results || []);
      setAllStudents(studentsArray);
      // Initial students list will be set by the useEffect above
      
      const classroomsArray = Array.isArray(classroomsData) ? classroomsData : ((classroomsData as any)?.results || []);
      setClassrooms(classroomsArray);
      
      const coursesArray = Array.isArray(coursesData) ? coursesData : (coursesData?.results || []);
      setCourses(coursesArray);
      
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData?.results || []));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment.id);
    setEditForm({
      grade: enrollment.grade || '',
      is_completed: enrollment.is_completed,
      notes: enrollment.notes || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ grade: '', is_completed: false, notes: '' });
  };

  const handleSave = async (enrollmentId: number) => {
    try {
      setSaving(true);
      setMessage(null);

      const enrollment = enrollments.find(e => e.id === enrollmentId);
      if (!enrollment) return;

      const updateData: any = {
        student_id: enrollment.student.id,
        course_id: enrollment.course.id,
        grade: editForm.grade || null,
        is_completed: editForm.is_completed,
        notes: editForm.notes || null,
      };

      if (editForm.is_completed && !enrollment.completion_date) {
        updateData.completion_date = new Date().toISOString();
      }

      await api.updateEnrollment(enrollmentId.toString(), updateData);
      
      setMessage({ type: 'success', text: 'Grade updated successfully!' });
      setEditingId(null);
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update grade' });
    } finally {
      setSaving(false);
    }
  };

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.is_completed).length;
  const enrollmentsWithGrades = enrollments.filter(e => e.grade).length;
  const averageGrade = () => {
    const grades = enrollments
      .filter(e => e.grade)
      .map(e => {
        const grade = e.grade?.toUpperCase() || '';
        if (grade === 'A') return 4;
        if (grade === 'B') return 3;
        if (grade === 'C') return 2;
        if (grade === 'D') return 1;
        if (grade === 'F') return 0;
        return null;
      })
      .filter((g): g is number => g !== null);
    
    if (grades.length === 0) return null;
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    return avg.toFixed(2);
  };

  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'text-ui-text-light';
    const g = grade.toUpperCase();
    if (g === 'A') return 'text-green-600 font-bold';
    if (g === 'B') return 'text-blue-600 font-semibold';
    if (g === 'C') return 'text-yellow-600';
    if (g === 'D') return 'text-orange-600';
    if (g === 'F') return 'text-red-600';
    return 'text-ui-text-dark';
  };

  const getGradeBackground = (grade: string | undefined) => {
    if (!grade) return 'bg-gray-50';
    const g = grade.toUpperCase();
    if (g === 'A') return 'bg-green-50 border-green-200';
    if (g === 'B') return 'bg-blue-50 border-blue-200';
    if (g === 'C') return 'bg-yellow-50 border-yellow-200';
    if (g === 'D') return 'bg-orange-50 border-orange-200';
    if (g === 'F') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <>
      <h1 className="sr-only">Grade Management</h1>

      {/* Header with Action */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ui-text-dark mb-2">Grade Management</h1>
          <p className="text-ui-text-light">Log and manage student grades for their enrolled courses</p>
        </div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Enroll Student
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Total Enrollments</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{totalEnrollments}</p>
            </div>
            <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Completed</p>
              <p className="text-3xl font-extrabold text-green-600 mt-1">{completedEnrollments}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Graded</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{enrollmentsWithGrades}</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Average GPA</p>
              <p className="text-3xl font-extrabold text-purple-700">
                {averageGrade() ? averageGrade() : '0.00'}
              </p>
              {!averageGrade() && (
                <p className="text-xs text-purple-600 mt-1">No grades recorded yet</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-end">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-ui-text-light mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
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
          </div>

          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <div className="flex-1">
              <label className="block text-xs font-medium text-ui-text-light mb-1">Classroom / Batch</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
              >
                <option value="">All Classrooms</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id.toString()}>
                    {classroom.name}{classroom.batch_number ? ` - Batch ${classroom.batch_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-ui-text-light mb-1">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
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
          </div>
        </div>
      </Card>

      {/* Grades Table */}
      <Card>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-ui-border min-w-[700px]">
            <thead className="bg-gradient-to-r from-ui-background to-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Student</span>
                    <ArrowUpDown className="w-2 h-2 sm:w-3 sm:h-3 text-ui-text-light opacity-50 hidden sm:inline" />
                  </div>
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Course</span>
                    <ArrowUpDown className="w-2 h-2 sm:w-3 sm:h-3 text-ui-text-light opacity-50 hidden sm:inline" />
                  </div>
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider hidden md:table-cell">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    Enrolled Date
                    <ArrowUpDown className="w-2 h-2 sm:w-3 sm:h-3 text-ui-text-light opacity-50" />
                  </div>
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Grade</span>
                    <ArrowUpDown className="w-2 h-2 sm:w-3 sm:h-3 text-ui-text-light opacity-50 hidden sm:inline" />
                  </div>
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border bg-ui-card-background">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ui-text-light">
                    Loading enrollments...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={BookOpen}
                      title="No enrollments found"
                      description="Enroll students in courses to begin tracking their progress and grades. Use the 'Enroll Student' button above to get started."
                      action={{
                        label: 'Enroll Student',
                        onClick: () => window.location.href = '/admin/courses',
                      }}
                    />
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => {
                  const isEditing = editingId === enrollment.id;

                  return (
                    <tr key={enrollment.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 hover:shadow-sm">
                      <td className="py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-ui-text-dark">
                          {enrollment.student.full_name}
                        </div>
                        <div className="text-xs text-ui-text-light hidden md:block">
                          {enrollment.student.email}
                        </div>
                      </td>
                      <td className="py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-ui-text-dark">
                          {enrollment.course.name}
                        </div>
                      </td>
                      <td className="py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm text-ui-text-light hidden md:table-cell">
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.grade}
                            onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                            className="px-3 py-1.5 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                          >
                            <option value="">No Grade</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-lg border ${getGradeBackground(enrollment.grade)} ${getGradeColor(enrollment.grade)}`}>
                            {enrollment.grade || '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isEditing ? (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editForm.is_completed}
                              onChange={(e) => setEditForm({ ...editForm, is_completed: e.target.checked })}
                              className="rounded border-ui-border"
                            />
                            <span className="text-sm text-ui-text-light">Completed</span>
                          </label>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                            enrollment.is_completed
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {enrollment.is_completed ? 'Completed' : 'In Progress'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSave(enrollment.id)}
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(enrollment)}
                            className="p-1.5 text-logo-primary-blue hover:bg-blue-50 rounded transition-colors"
                            title="Edit Grade"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
