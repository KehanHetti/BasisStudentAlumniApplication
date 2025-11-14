// src/lib/types.ts

export interface Classroom {
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

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: string;
  status: 'active' | 'alumni' | 'dropped' | 'suspended';
  enrollment_date: string;
  graduation_date?: string;
  profile_photo?: string;
  profile_photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  age?: number;
  classroom?: number;
  classroom_name?: string;
  classroom_batch?: number;
  current_job?: string;
  salary?: number;
  job_before_bloom?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  max_students: number;
  status: 'active' | 'inactive' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  student: Student;
  student_id: number;
  course: Course;
  course_name: string;
  enrollment_date: string;
  completion_date?: string;
  grade?: string;
  is_completed: boolean;
  notes?: string;
}

export interface Attendance {
  id: number;
  student: Student;
  student_id: number;
  course: Course;
  course_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: number;
  course: Course;
  course_id: number;
  date: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  student: Student;
  student_id: number;
  course?: Course;
  course_id?: number;
  entry_type: 'progress' | 'achievement' | 'concern' | 'general' | 'goal';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_private: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalGoal {
  id: number;
  student: Student;
  student_id: number;
  title: string;
  description?: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  name: string;
  report_type: 'attendance' | 'progress' | 'enrollment' | 'completion' | 'custom';
  description?: string;
  parameters: Record<string, any>;
  generated_by?: string;
  generated_at: string;
  file_path?: string;
  is_public: boolean;
}

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    graduated: number;
  };
  courses: {
    total: number;
    active: number;
    enrollments: number;
  };
  attendance: {
    percentage: number;
    total_records: number;
    present_count: number;
  };
  journals: {
    total_entries: number;
    recent_entries: number;
  };
}

export interface AttendanceStats {
  total_attendance: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
}

export interface StudentAttendanceStats {
  student_id: number;
  student_name: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
}