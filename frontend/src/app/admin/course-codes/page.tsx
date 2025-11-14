'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';
import { extractArrayFromResponse } from '@/lib/apiHelpers';
import { Plus, Key, Users, Calendar, ToggleLeft, ToggleRight, Trash2, BookOpen } from 'lucide-react';

interface CourseCode {
  id: number;
  code: string;
  course_id?: number;
  course?: {
    id: number;
    name: string;
    description?: string;
  };
  name: string;
  description: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  created_by: string;
}

export default function CourseCodesPage() {
  const { user } = useAuth();
  const [courseCodes, setCourseCodes] = useState<CourseCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    course_id: '',
    description: '',
    max_uses: 100,
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ui-text-dark mb-4">Access Denied</h1>
          <p className="text-ui-text-light">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchCourseCodes();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const coursesData = await api.getCourses();
      const coursesArray = extractArrayFromResponse<Course>(coursesData as Course[] | { results: Course[] });
      // Only show courses that haven't been used for a course code yet
      const usedCourseIds = new Set(courseCodes.map(cc => cc.course_id).filter(Boolean));
      const availableCourses = coursesArray.filter(
        course => !usedCourseIds.has(course.id)
      );
      setCourses(coursesArray);
    } catch (error) {
    }
  };

  const fetchCourseCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/course-codes/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourseCodes(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch course codes');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const createCourseCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!createForm.course_id) {
      setError('Please select a course');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/course-codes/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          course_id: parseInt(createForm.course_id),
          description: createForm.description,
          max_uses: createForm.max_uses,
        }),
      });

      if (response.ok) {
        const newCode = await response.json();
        setCourseCodes([newCode, ...courseCodes]);
        setCreateForm({ course_id: '', description: '', max_uses: 100 });
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create course code');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseCode = async (codeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/auth/course-codes/${codeId}/toggle/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const updatedCode = await response.json();
        setCourseCodes(courseCodes.map(cc => 
          cc.id === codeId 
            ? { ...cc, is_active: updatedCode.is_active }
            : cc
        ));
      } else {
        setError('Failed to toggle course code');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  if (loading && courseCodes.length === 0) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading course codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ui-text-dark">Course Codes</h1>
          <p className="text-ui-text-light mt-2">
            Manage course codes for student registration
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-logo-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Code
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-ui-text-dark">Create Course Code</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-ui-text-light hover:text-ui-text-dark"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={createCourseCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-text-dark mb-2">
                  Select Course *
                </label>
                <select
                  value={createForm.course_id}
                  onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id.toString()}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ui-text-dark mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ui-text-dark mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={createForm.max_uses}
                  onChange={(e) => setCreateForm({ ...createForm, max_uses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                  min="1"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-logo-primary-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 text-ui-text-dark py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Course Codes List */}
      <div className="grid gap-4">
        {courseCodes.map((courseCode) => (
          <Card key={courseCode.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ui-text-dark">
                      {courseCode.course ? courseCode.course.name : courseCode.name}
                    </h3>
                    <p className="text-sm text-ui-text-light">
                      Code: <span className="font-mono font-medium">{courseCode.code}</span>
                      {courseCode.course && (
                        <span className="ml-2 text-xs text-ui-text-light">
                          <BookOpen className="inline w-3 h-3 mr-1" />
                          {courseCode.course.name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {courseCode.description && (
                  <p className="text-sm text-ui-text-light mb-3">{courseCode.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm text-ui-text-light">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{courseCode.current_uses}/{courseCode.max_uses} uses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(courseCode.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>By {courseCode.created_by}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCourseCode(courseCode.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    courseCode.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={courseCode.is_active ? 'Deactivate' : 'Activate'}
                >
                  {courseCode.is_active ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {courseCodes.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-ui-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ui-text-dark mb-2">No Course Codes</h3>
            <p className="text-ui-text-light mb-4">Create your first course code to allow student registration.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-logo-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Course Code
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
