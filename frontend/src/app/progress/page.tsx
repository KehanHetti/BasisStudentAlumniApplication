'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Student, Course, Enrollment, JournalEntry, JournalGoal } from '@/lib/types';
import { api } from '@/lib/api';
import { TrendingUp, Target, BookOpen, Award, Calendar, Filter, BarChart3 } from 'lucide-react';

export default function ProgressPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<JournalGoal[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedStudent, selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData, enrollmentsData, entriesData, goalsData] = await Promise.all([
        api.getStudents(),
        api.getCourses(),
        api.getEnrollments({
          student_id: selectedStudent || undefined,
          course_id: selectedCourse || undefined,
        }),
        api.getJournalEntries({
          student_id: selectedStudent || undefined,
          entry_type: 'progress',
        }),
        api.getJournalGoals({
          student_id: selectedStudent || undefined,
        }),
      ]);

      setStudents(studentsData.results || studentsData);
      setCourses(coursesData.results || coursesData);
      setEnrollments(enrollmentsData.results || enrollmentsData);
      setJournalEntries(entriesData.results || entriesData);
      setGoals(goalsData.results || goalsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'in_progress').length;
  const pendingGoals = goals.filter(goal => goal.status === 'pending').length;
  const completedEnrollments = enrollments.filter(enrollment => enrollment.is_completed).length;
  const totalEnrollments = enrollments.length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  return (
    <>
      <h1 className="sr-only">Student Progress Tracking</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm font-medium text-ui-text-light">Completion Rate</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{completionRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Active Goals</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{inProgressGoals + pendingGoals}</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card title="Course Progress">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-ui-text-light">
                Loading course progress...
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8 text-ui-text-light">
                No enrollments found.
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-ui-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-ui-text-dark">{enrollment.course.name}</h3>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                      enrollment.is_completed 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {enrollment.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-sm text-ui-text-light mb-2">
                    Student: {enrollment.student.full_name}
                  </p>
                  <p className="text-sm text-ui-text-light">
                    Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    {enrollment.completion_date && (
                      <span className="ml-2">
                        • Completed: {new Date(enrollment.completion_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  {enrollment.grade && (
                    <p className="text-sm font-medium text-ui-text-dark mt-1">
                      Grade: {enrollment.grade}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Goals Progress */}
        <Card title="Goals Progress">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-ui-text-light">
                Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 text-ui-text-light">
                No goals found.
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="border border-ui-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-ui-text-dark">{goal.title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(goal.status)}`}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-ui-text-light mb-2">
                    Student: {goal.student.full_name}
                  </p>
                  {goal.description && (
                    <p className="text-sm text-ui-text-light mb-2">{goal.description}</p>
                  )}
                  {goal.target_date && (
                    <p className="text-sm text-ui-text-light">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Progress Entries */}
      <Card title="Recent Progress Entries">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-ui-text-light">
              Loading progress entries...
            </div>
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-8 text-ui-text-light">
              No progress entries found.
            </div>
          ) : (
            journalEntries.map((entry) => (
              <div key={entry.id} className="border border-ui-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-ui-text-dark">{entry.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(entry.priority)}`}>
                      {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                    </span>
                    {entry.is_private && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-ui-text-light mb-2">
                  Student: {entry.student.full_name}
                  {entry.course && ` • Course: ${entry.course.name}`}
                </p>
                <p className="text-sm text-ui-text-dark mb-2">{entry.content}</p>
                <p className="text-xs text-ui-text-light">
                  {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                  {entry.created_by && ` • By: ${entry.created_by}`}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
