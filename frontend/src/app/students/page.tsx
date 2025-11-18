'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Student } from '@/lib/types';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { extractArrayFromResponse } from '@/lib/apiHelpers';

const statusColorMap = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  alumni: 'bg-purple-50 text-purple-700 border border-purple-200',
  dropped: 'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { showToast } = useToast();
  const pageSize = 20; // Default page size from backend

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [searchTerm, statusFilter, currentPage, showAll]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      // If showAll is true, fetch all students without pagination
      if (showAll) {
        // Use the all=true parameter to get all students
        const allData = await api.getStudents({
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          all: true,
        });
        
        // Handle response - should be an array when all=true
        const studentsArray = extractArrayFromResponse<Student>(allData as Student[] | { results: Student[] });
        
        setStudents(studentsArray);
        setTotalCount(studentsArray.length);
        setTotalPages(1);
        return;
      }
      
      // Normal paginated request
      const data = await api.getStudents({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        page: currentPage,
      });
      
      // Handle paginated response
      const studentsArray = extractArrayFromResponse<Student>(data as Student[] | { results: Student[] });
      const paginatedData = data as { results?: Student[]; count?: number };
      if (paginatedData.results || Array.isArray(data)) {
        setStudents(studentsArray);
        const count = paginatedData.count || studentsArray.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      } else {
        // Handle non-paginated response
        const studentsArray = Array.isArray(data) ? data : [];
        setStudents(studentsArray);
        setTotalCount(studentsArray.length);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error loading students:', error);
      const errorMessage = error?.message || error?.error || 'Failed to load students';
      showToast(errorMessage, 'error');
      setStudents([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.deleteStudent(deleteConfirm.toString());
      await loadStudents(); // Refresh the list
      showToast('Student deleted successfully', 'success');
      setDeleteConfirm(null);
    } catch (error) {
      showToast('Error deleting student. Please try again.', 'error');
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <h1 className="sr-only">Student Directory</h1>

      <Card title="Student Directory">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-ui-border pb-4 gap-4">
          <p className="text-ui-text-light text-lg">Manage all student profiles and their progress.</p>
          <Link
            href="/students/new"
            className="inline-flex items-center px-6 py-2.5 bg-logo-secondary-blue text-white font-semibold rounded-lg shadow-custom-sm hover:bg-logo-primary-blue transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Student
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-ui-border">
          <div className="flex items-center space-x-2 flex-1 min-w-full sm:min-w-[250px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ui-text-light" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent bg-white"
                aria-label="Search students"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="alumni">Alumni</option>
              <option value="dropped">Dropped</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="show-all-checkbox" className="text-sm text-ui-text-light font-medium cursor-pointer">
              Show all students:
            </label>
            <input
              id="show-all-checkbox"
              type="checkbox"
              checked={showAll}
              onChange={(e) => {
                setShowAll(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 text-logo-secondary-blue border-ui-border rounded focus:ring-2 focus:ring-logo-secondary-blue cursor-pointer"
              title="Display all students without pagination"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative -mx-4 sm:mx-0">
          <div className="sticky top-0 z-10 bg-ui-card-background border-b-2 border-ui-border shadow-sm min-w-[800px]">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-ui-background to-gray-50">
                <tr>
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Photo</span>
                    </div>
                  </th>
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">Name</th>
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider hidden md:table-cell">Email</th>
                  {students.some(s => s.phone) && (
                    <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider hidden lg:table-cell">Phone</th>
                  )}
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Classroom</span>
                    </div>
                  </th>
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider">Status</th>
                  <th scope="col" className="py-2 sm:py-3.5 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold text-ui-text-light uppercase tracking-wider hidden lg:table-cell">Enrolled On</th>
                  <th scope="col" className="relative py-2 sm:py-3.5 px-2 sm:px-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          <table className="min-w-full divide-y divide-ui-border min-w-[800px]">
            <tbody className="divide-y divide-ui-border bg-ui-card-background">
              {loading ? (
                <tr>
                  <td colSpan={students.some(s => s.phone) ? 8 : 7} className="py-8 text-center text-ui-text-light">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={students.some(s => s.phone) ? 8 : 7} className="py-8 text-center text-ui-text-light">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr 
                    key={student.id} 
                    className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 hover:shadow-sm"
                  >
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-logo-primary-blue flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                        {student.profile_photo_url ? (
                          <img
                            src={student.profile_photo_url}
                            alt={student.full_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-logo-primary-blue to-logo-secondary-blue">
                            <span className="text-white text-xs sm:text-sm font-bold">
                              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4">
                      <div className="text-xs sm:text-sm font-semibold text-ui-text-dark group-hover:text-logo-secondary-blue transition-colors">
                        {student.full_name}
                      </div>
                      <div className="text-xs text-ui-text-light md:hidden mt-0.5">{student.email}</div>
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light hidden md:table-cell">{student.email}</td>
                    {students.some(s => s.phone) && (
                      <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light hidden lg:table-cell">
                        {student.phone || '-'}
                      </td>
                    )}
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      {student.classroom_name ? (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="hidden sm:inline">{student.classroom_name}</span>
                          <span className="sm:hidden">{student.classroom_name.split(' ')[0]}</span>
                          {student.classroom_batch && <span className="hidden md:inline">{` - Batch ${student.classroom_batch}`}</span>}
                        </span>
                      ) : (
                        <span className="text-ui-text-light">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full shadow-sm ${statusColorMap[student.status]}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-ui-text-light hidden lg:table-cell">
                      {new Date(student.enrollment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <Link 
                          href={`/students/${student.id}`} 
                          className="p-1.5 sm:p-2 text-logo-secondary-blue hover:text-white hover:bg-logo-secondary-blue rounded-lg transition-all duration-200 touch-target"
                          title="View/Edit"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                        <Link 
                          href={`/students/${student.id}`} 
                          className="p-1.5 sm:p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 touch-target"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(student.id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 touch-target"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!showAll && totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between border-t-2 border-ui-border pt-4 sm:pt-6 gap-3 sm:gap-4 bg-gradient-to-r from-gray-50 to-transparent p-3 sm:p-4 rounded-lg">
            <div className="text-xs sm:text-sm font-medium text-ui-text-dark text-center sm:text-left">
              Showing <span className="font-bold text-logo-secondary-blue">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-bold text-logo-secondary-blue">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-logo-secondary-blue">{totalCount}</span> students
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-ui-text-dark bg-white border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
                title="First page"
              >
                <span className="hidden sm:inline">First</span>
                <span className="sm:hidden">«</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-ui-text-dark bg-white border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">‹</span>
              </button>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="px-1 sm:px-2 text-xs sm:text-sm text-ui-text-light">Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-12 sm:w-16 px-1 sm:px-2 py-2 text-xs sm:text-sm text-center border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent touch-target"
                />
                <span className="px-1 sm:px-2 text-xs sm:text-sm text-ui-text-light">of {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-ui-text-dark bg-white border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-ui-text-dark bg-white border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
                title="Last page"
              >
                <span className="hidden sm:inline">Last</span>
                <span className="sm:hidden">»</span>
              </button>
            </div>
          </div>
        )}
        {showAll && (
          <div className="mt-6 flex items-center justify-between border-t border-ui-border pt-4">
            <div className="text-sm text-ui-text-light">
              Showing all {totalCount} students
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}