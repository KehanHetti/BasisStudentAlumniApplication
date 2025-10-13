'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Student } from '@/lib/types';
import { api } from '@/lib/api';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const data = await api.getStudent(studentId);
      setStudent(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading student:', error);
      alert('Error loading student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!student) return;
    
    setSaving(true);
    try {
      await api.updateStudent(studentId, formData);
      await loadStudent(); // Reload the student data
      setEditing(false);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Error updating student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    
    if (window.confirm(`Are you sure you want to delete ${student.full_name}? This action cannot be undone.`)) {
      try {
        await api.deleteStudent(studentId);
        router.push('/students');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setFormData(student || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ui-text-light">Loading student...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ui-text-light">Student not found</div>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Student Details</h1>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/students')}
          className="flex items-center gap-2 text-ui-text-light hover:text-ui-text-dark transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-ui-text-light hover:text-ui-text-dark transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-logo-accent-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-2">
          <Card title="Student Information">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    First Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-ui-text-dark">{student.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Last Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-ui-text-dark">{student.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-ui-text-dark">{student.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-ui-text-dark">{student.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-ui-text-dark">
                      {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Gender
                  </label>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-ui-text-dark">{student.gender || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Status
                  </label>
                  {editing ? (
                    <select
                      name="status"
                      value={formData.status || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="graduated">Graduated</option>
                      <option value="dropped">Dropped</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                      student.status === 'graduated' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      student.status === 'dropped' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Address
                </label>
                {editing ? (
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                  />
                ) : (
                  <p className="text-ui-text-dark">{student.address || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Notes
                </label>
                {editing ? (
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                  />
                ) : (
                  <p className="text-ui-text-dark">{student.notes || '-'}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Information */}
        <div>
          <Card title="Additional Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Enrollment Date
                </label>
                <p className="text-ui-text-dark">
                  {new Date(student.enrollment_date).toLocaleDateString()}
                </p>
              </div>

              {student.graduation_date && (
                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Graduation Date
                  </label>
                  <p className="text-ui-text-dark">
                    {new Date(student.graduation_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {student.age && (
                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Age
                  </label>
                  <p className="text-ui-text-dark">{student.age} years old</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Emergency Contact
                </label>
                <p className="text-ui-text-dark">
                  {student.emergency_contact_name || '-'}
                </p>
                {student.emergency_contact_phone && (
                  <p className="text-sm text-ui-text-light">
                    {student.emergency_contact_phone}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}