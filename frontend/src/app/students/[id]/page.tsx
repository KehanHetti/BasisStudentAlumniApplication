'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Student, JournalEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { ArrowLeft, Edit, Save, X, Trash2, Upload, Camera, BookOpen } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const loadStudent = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await api.getStudent(studentId) as Student;
      setStudent(data);
      setFormData(data);
    } catch (error) {
      showToast('Error loading student. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const loadClassrooms = useCallback(async () => {
    try {
      const data = await api.getClassrooms();
      const classroomsArray = Array.isArray(data) ? data : ((data as any)?.results || []);
      setClassrooms(classroomsArray);
    } catch (error) {
    }
  }, []);

  const loadJournalEntries = useCallback(async () => {
    if (!studentId) return;
    try {
      const data = await api.getJournalEntries({ student_id: studentId });
      const entriesArray = Array.isArray(data) ? data : ((data as any)?.results || []);
      setJournalEntries(entriesArray);
    } catch (error) {
    }
  }, [studentId]);

  const uploadPhotoFile = useCallback(async (file: File) => {
    if (!student) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await api.uploadStudentPhoto(studentId, file);
      if (response.student) {
        setStudent(response.student);
        showToast('Photo uploaded successfully!', 'success');
      }
    } catch (error: any) {
      showToast(error?.error || 'Error uploading photo. Please try again.', 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [student, studentId]);

  // Load student and classrooms data - only when studentId changes
  useEffect(() => {
    if (studentId) {
      loadStudent();
      loadClassrooms();
      loadJournalEntries();
    }
  }, [studentId, loadStudent, loadClassrooms, loadJournalEntries]);

  // Add paste event listener - separate effect that doesn't cause re-renders
  useEffect(() => {
    if (!student) return; // Don't add listener if no student loaded yet

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !student) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            uploadPhotoFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [student, uploadPhotoFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'classroom' ? (value ? parseInt(value) : null) : 
              name === 'salary' ? (value ? parseFloat(value) : null) : 
              value
    }));
  };

  const handleSave = async () => {
    if (!student) return;
    
    setSaving(true);
    try {
      await api.updateStudent(studentId, formData);
      await loadStudent(); // Reload the student data
      setEditing(false);
      showToast('Student updated successfully', 'success');
    } catch (error) {
      showToast('Error updating student. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!student) return;
    
    try {
      await api.deleteStudent(studentId);
      showToast('Student deleted successfully', 'success');
      router.push('/students');
    } catch (error) {
      showToast('Error deleting student. Please try again.', 'error');
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    setFormData(student || {});
    setEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhotoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadPhotoFile(file);
    }
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
                onClick={handleDeleteClick}
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
                      <option value="alumni">Alumni</option>
                      <option value="dropped">Dropped</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                      student.status === 'alumni' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      student.status === 'dropped' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Classroom / Batch
                  </label>
                  {editing ? (
                    <select
                      name="classroom"
                      value={formData.classroom || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="">No Classroom</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                          {classroom.batch_number ? ` - Batch ${classroom.batch_number}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-ui-text-dark">
                      {student.classroom_name 
                        ? `${student.classroom_name}${student.classroom_batch ? ` - Batch ${student.classroom_batch}` : ''}`
                        : '-'}
                    </p>
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
          <Card title="Profile Photo">
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div
                  ref={photoContainerRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative w-48 h-48 rounded-full overflow-hidden bg-gray-200 border-4 mb-4 transition-all ${
                    isDragging
                      ? 'border-logo-accent-green border-8 scale-105 shadow-2xl'
                      : 'border-logo-primary-blue'
                  } ${uploadingPhoto ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                  title="Click to upload, drag & drop, or paste an image"
                >
                  {student.profile_photo_url ? (
                    <img
                      src={student.profile_photo_url}
                      alt={student.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-logo-primary-blue to-logo-secondary-blue">
                      <span className="text-white text-4xl font-bold">
                        {student.first_name?.charAt(0) || ''}{student.last_name?.charAt(0) || ''}
                      </span>
                    </div>
                  )}
                  {isDragging && (
                    <div className="absolute inset-0 bg-logo-accent-green/20 flex items-center justify-center z-10">
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-white mx-auto mb-2" />
                        <p className="text-white font-semibold">Drop image here</p>
                      </div>
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-white font-semibold">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200 cursor-pointer ${
                    uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {student.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </label>
                <p className="text-xs text-ui-text-light mt-2 text-center max-w-xs">
                  Click to browse, drag & drop, or paste (Ctrl+V) an image
                  <br />
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Additional Information" className="mt-6">
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

          {/* Employment Information */}
          <Card title="Employment Information" className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Current Job
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="current_job"
                    value={formData.current_job || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Current job title or position"
                  />
                ) : (
                  <p className="text-ui-text-dark">{student.current_job || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Salary (Monthly)
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Monthly salary"
                  />
                ) : (
                  <p className="text-ui-text-dark">
                    {student.salary ? `₹${Number(student.salary).toLocaleString('en-IN')}` : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-text-light mb-2">
                  Job Before Bloom
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="job_before_bloom"
                    value={formData.job_before_bloom || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Job or status before joining Bloom"
                  />
                ) : (
                  <p className="text-ui-text-dark">{student.job_before_bloom || '-'}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Journal Entries Section */}
      <div className="mt-6">
        <Card title={
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <span>Journal Entries</span>
            {journalEntries.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-logo-secondary-blue text-white text-xs font-semibold rounded-full">
                {journalEntries.length}
              </span>
            )}
          </div>
        }>
          {journalEntries.length === 0 ? (
            <div className="text-center py-8 text-ui-text-light">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-ui-text-light opacity-50" />
              <p>No journal entries yet for this student.</p>
              <p className="text-sm mt-1">Add entries from the Journals page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map((entry) => {
                const getEntryTypeColor = (type: string) => {
                  switch (type) {
                    case 'progress':
                      return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'achievement':
                      return 'bg-green-50 text-green-700 border-green-200';
                    case 'concern':
                      return 'bg-red-50 text-red-700 border-red-200';
                    case 'goal':
                      return 'bg-purple-50 text-purple-700 border-purple-200';
                    case 'general':
                      return 'bg-gray-50 text-gray-700 border-gray-200';
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

                return (
                  <div
                    key={entry.id}
                    className="border border-ui-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getEntryTypeColor(entry.entry_type)}`}>
                          {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(entry.priority)}`}>
                          {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                        </span>
                        {entry.is_private && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Private
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ui-text-light">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ui-text-dark mb-2">{entry.title}</h3>
                    <p className="text-ui-text-light text-sm whitespace-pre-wrap mb-2">{entry.content}</p>
                    {entry.created_by && (
                      <p className="text-xs text-ui-text-light">
                        Created by: {entry.created_by}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Student"
        message={student ? `Are you sure you want to delete ${student.full_name}? This action cannot be undone.` : 'Are you sure you want to delete this student? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}