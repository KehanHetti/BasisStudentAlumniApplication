'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { BookOpen, Plus, Edit, Trash2, Save, X, Users, ChevronDown, ChevronRight, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Classroom {
  id: number;
  name: string;
  batch_number?: number;
  description?: string;
  is_active: boolean;
  student_count: number;
  teachers: Array<{ id: number; username: string; email: string; full_name: string }>;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  status: string;
  profile_photo_url?: string;
  classroom?: number;
}

export default function CoursesManagementPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClassrooms, setExpandedClassrooms] = useState<Set<number>>(new Set());
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = user && (user.role === 'admin' || user.role === 'teacher');

  useEffect(() => {
    if (canManage) {
      loadData();
    }
  }, [canManage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const [classroomsData, studentsData] = await Promise.all([
        api.getClassrooms(),
        // Load all students without pagination
        fetch(`${API_BASE_URL}/students/?all=true`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
      ]);
      
      const classroomsArray = Array.isArray(classroomsData) 
        ? classroomsData 
        : ((classroomsData as any)?.results || []);
      setClassrooms(classroomsArray as Classroom[]);
      
      // Handle response - should be array if all=true
      const allStudents = Array.isArray(studentsData) 
        ? studentsData 
        : ((studentsData as any)?.results || []);
      setStudents(allStudents);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleClassroom = (classroomId: number) => {
    const newExpanded = new Set(expandedClassrooms);
    if (newExpanded.has(classroomId)) {
      newExpanded.delete(classroomId);
    } else {
      newExpanded.add(classroomId);
    }
    setExpandedClassrooms(newExpanded);
  };

  const getClassroomStudents = (classroomId: number) => {
    const classroomStudents = students.filter(s => s.classroom === classroomId);
    // Sort alphabetically by full name
    return classroomStudents.sort((a, b) => {
      const nameA = a.full_name.toLowerCase();
      const nameB = b.full_name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const getUnassignedStudents = () => {
    return students.filter(s => !s.classroom || s.classroom === null);
  };

  const handleCreate = () => {
    setEditingClassroom({
      id: 0,
      name: '',
      batch_number: undefined,
      description: '',
      is_active: true,
      student_count: 0,
      teachers: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setError(null);
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom({ ...classroom });
    setIsCreating(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditingClassroom(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingClassroom) return;

    try {
      setError(null);
      setMessage(null);

      if (!editingClassroom.name.trim()) {
        setError('Classroom name is required');
        return;
      }

      const classroomData = {
        name: editingClassroom.name,
        batch_number: editingClassroom.batch_number || null,
        description: editingClassroom.description || '',
        is_active: editingClassroom.is_active,
      };

      if (isCreating) {
        await fetch('http://localhost:8000/api/students/classrooms/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(classroomData),
        });
        setMessage({ type: 'success', text: 'Classroom created successfully!' });
      } else {
        await fetch(`http://localhost:8000/api/students/classrooms/${editingClassroom.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(classroomData),
        });
        setMessage({ type: 'success', text: 'Classroom updated successfully!' });
      }

      setEditingClassroom(null);
      setIsCreating(false);
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save classroom');
    }
  };

  const handleDelete = async (classroomId: number) => {
    if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`http://localhost:8000/api/students/classrooms/${classroomId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      setMessage({ type: 'success', text: 'Classroom deleted successfully!' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete classroom');
    }
  };

  const handleAssignStudent = async (studentId: number, classroomId: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      await api.updateStudent(studentId.toString(), {
        ...student,
        classroom: classroomId,
      });
      
      setMessage({ type: 'success', text: 'Student assigned successfully!' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to assign student');
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ui-text-dark mb-4">Access Denied</h1>
          <p className="text-ui-text-light">You need administrator or teacher privileges to manage classrooms.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  const filteredClassrooms = classrooms.filter(c => {
    const search = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(search) || 
           (c.batch_number && c.batch_number.toString().includes(search));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ui-text-dark">Classroom Management</h1>
          <p className="text-ui-text-light mt-1">Manage classrooms and assign students</p>
        </div>
        {!editingClassroom && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Classroom
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {editingClassroom && (
        <Card title={isCreating ? 'Create New Classroom' : 'Edit Classroom'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ui-text-dark mb-2">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  value={editingClassroom.name}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, name: e.target.value })}
                  className="w-full px-4 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                  placeholder="e.g., Freesia Bloom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-text-dark mb-2">
                  Batch Number
                </label>
                <input
                  type="number"
                  value={editingClassroom.batch_number || ''}
                  onChange={(e) => setEditingClassroom({ 
                    ...editingClassroom, 
                    batch_number: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="w-full px-4 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                  placeholder="Optional"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ui-text-dark mb-2">
                Description
              </label>
              <textarea
                value={editingClassroom.description || ''}
                onChange={(e) => setEditingClassroom({ ...editingClassroom, description: e.target.value })}
                className="w-full px-4 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Create Classroom' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ui-text-light" />
        <input
          type="text"
          placeholder="Search classrooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
        />
      </div>

      {/* Classrooms List */}
      <div className="space-y-4">
        {filteredClassrooms.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-ui-text-light">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-ui-text-light opacity-50" />
              <p className="text-lg font-medium mb-2">No classrooms found</p>
              <p className="text-sm">Create your first classroom to get started.</p>
            </div>
          </Card>
        ) : (
          filteredClassrooms.map((classroom) => {
            const classroomStudents = getClassroomStudents(classroom.id);
            const isExpanded = expandedClassrooms.has(classroom.id);
            
            return (
              <Card key={classroom.id} className="overflow-hidden">
                <div 
                  className="cursor-pointer"
                  onClick={() => toggleClassroom(classroom.id)}
                >
                  <div className="flex items-center justify-between p-6 hover:bg-ui-background transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-logo-primary-blue to-logo-secondary-blue rounded-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-ui-text-dark">
                            {classroom.name}
                            {classroom.batch_number && ` - Batch ${classroom.batch_number}`}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            classroom.is_active 
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {classroom.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {classroom.description && (
                          <p className="text-sm text-ui-text-light mb-2">{classroom.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-ui-text-light">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{classroomStudents.length} students</span>
                          </div>
                          {classroom.teachers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span>{classroom.teachers.length} teacher{classroom.teachers.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-ui-text-light" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-ui-text-light" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(classroom);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit classroom"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(classroom.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete classroom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Students List */}
                {isExpanded && (
                  <div className="border-t border-ui-border bg-ui-background">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-ui-text-dark">Students in this Classroom</h4>
                        <Link
                          href="/students"
                          className="text-sm text-logo-primary-blue hover:text-logo-secondary-blue font-medium flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign Students
                        </Link>
                      </div>
                      
                      {classroomStudents.length === 0 ? (
                        <div className="text-center py-8 text-ui-text-light bg-white rounded-lg border border-ui-border">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No students assigned to this classroom</p>
                          <Link
                            href="/students"
                            className="text-sm text-logo-primary-blue hover:underline mt-2 inline-block"
                          >
                            Go to Students to assign students
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {classroomStudents.map((student) => (
                            <Link
                              key={student.id}
                              href={`/students/${student.id}`}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-ui-border hover:border-logo-primary-blue hover:shadow-md transition-all duration-200 group"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-logo-primary-blue flex-shrink-0">
                                {student.profile_photo_url ? (
                                  <img
                                    src={student.profile_photo_url}
                                    alt={student.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-logo-primary-blue to-logo-secondary-blue">
                                    <span className="text-white text-sm font-bold">
                                      {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-ui-text-dark group-hover:text-logo-primary-blue transition-colors truncate">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-ui-text-light truncate">{student.email}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
