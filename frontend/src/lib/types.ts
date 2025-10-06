// src/lib/types.ts

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Active' | 'Graduated' | 'Dropped';
  enrollmentDate: string; // ISO 8601 format
  profilePhotoUrl?: string;
}