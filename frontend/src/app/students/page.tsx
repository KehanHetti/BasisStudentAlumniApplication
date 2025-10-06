// src/app/students/page.tsx

import Link from 'next/link';
import { Student } from '@/lib/types';
import Card from '@/components/ui/Card';
import Topbar from '@/components/layout/Topbar'; // Import Topbar to set title

// Mock data remains the same
const mockStudents: Student[] = [
  { id: '1', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@example.com', status: 'Active', enrollmentDate: '2025-08-15' },
  { id: '2', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@example.com', status: 'Active', enrollmentDate: '2025-08-15' },
  { id: '3', firstName: 'Rohan', lastName: 'Singh', email: 'rohan.singh@example.com', status: 'Graduated', enrollmentDate: '2025-03-10' },
  { id: '4', firstName: 'Saanvi', lastName: 'Gupta', email: 'saanvi.gupta@example.com', status: 'Dropped', enrollmentDate: '2025-07-20' },
];

const statusColorMap = {
  Active: 'bg-green-50 text-ui-success border border-green-200',
  Graduated: 'bg-blue-50 text-logo-primary-blue border border-blue-200',
  Dropped: 'bg-red-50 text-ui-danger border border-red-200',
};

export default function StudentsPage() {
  return (
    <>
      {/* If Topbar needs dynamic title per page, it would receive it as a prop from here */}
      <h1 className="sr-only">Student Directory</h1> {/* Hidden for accessibility */}

      <Card title="Student Directory">
        <div className="flex justify-between items-center mb-6 border-b border-ui-border pb-4">
          <p className="text-ui-text-light text-lg">Manage all student profiles and their progress.</p>
          <Link
            href="/students/new"
            className="inline-flex items-center px-6 py-2.5 bg-logo-secondary-blue text-white font-semibold rounded-lg shadow-custom-sm hover:bg-logo-primary-blue transition-colors duration-200"
          >
            + Add New Student
          </Link>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-ui-border">
            <thead className="bg-ui-background">
              <tr>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Name</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Email</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Status</th>
                <th scope="col" className="py-3.5 px-4 text-left text-sm font-bold text-ui-text-light uppercase tracking-wider">Enrolled On</th>
                <th scope="col" className="relative py-3.5 px-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border bg-ui-card-background">
              {mockStudents.map((student) => (
                <tr key={student.id} className="hover:bg-ui-background transition-colors duration-150">
                  <td className="whitespace-nowrap py-4 px-4 text-sm font-medium text-ui-text-dark">{student.firstName} {student.lastName}</td>
                  <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">{student.email}</td>
                  <td className="whitespace-nowrap py-4 px-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusColorMap[student.status]}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 px-4 text-sm text-ui-text-light">{new Date(student.enrollmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="whitespace-nowrap py-4 px-4 text-right text-sm font-medium">
                    <Link href={`/students/${student.id}`} className="text-logo-secondary-blue hover:text-logo-primary-blue font-semibold transition-colors duration-200">
                      View Profile<span className="sr-only">, {student.firstName} {student.lastName}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}