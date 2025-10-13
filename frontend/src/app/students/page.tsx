'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Student } from '@/lib/types';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';

const statusColorMap = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  graduated: 'bg-blue-50 text-blue-700 border border-blue-200',
  dropped: 'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadStudents();
  }, [searchTerm, statusFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      setStudents(data.results || data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.deleteStudent(id.toString());
        await loadStudents(); // Refresh the list
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      }
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
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-ui-text-light" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            />
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
              <option value="graduated">Graduated</option>
              <option value="dropped">Dropped</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ui-border">
            <thead className="bg-ui-background">
              <tr>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Name</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Email</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Phone</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Status</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Enrolled On</th>
                <th scope="col" className="relative py-3.5 px-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border bg-ui-card-background">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ui-text-light">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ui-text-light">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-ui-background transition-colors duration-150">
                    <td className="whitespace-nowrap py-4 px-4 text-sm font-medium text-ui-text-dark">
                      {student.full_name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">{student.email}</td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">
                      {student.phone || '-'}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusColorMap[student.status]}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">
                      {new Date(student.enrollment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/students/${student.id}`} 
                          className="text-logo-secondary-blue hover:text-logo-primary-blue transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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