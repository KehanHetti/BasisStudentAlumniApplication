// src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Token ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }
    
    // Handle DELETE requests that return 204 No Content
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error}`, 0);
  }
}

export const api = {
  // Authentication
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: any) => {
    return apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout/', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile/');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData: { old_password: string; new_password: string; new_password_confirm: string }) => {
    return apiRequest('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  requestRoleChange: async (roleData: { requested_role: string; reason: string }) => {
    return apiRequest('/auth/role-requests/', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  getRoleRequests: async () => {
    return apiRequest('/auth/role-requests/');
  },

  // Students
  getStudents: async (params?: { status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `/students/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  getStudent: async (id: string) => {
    return apiRequest(`/students/${id}/`);
  },

  createStudent: async (studentData: any) => {
    return apiRequest('/students/', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (id: string, studentData: any) => {
    return apiRequest(`/students/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: async (id: string) => {
    return apiRequest(`/students/${id}/`, {
      method: 'DELETE',
    });
  },

  getStudentStats: async () => {
    return apiRequest('/students/stats/');
  },

  // Courses
  getCourses: async () => {
    return apiRequest('/courses/');
  },

  getCourse: async (id: string) => {
    return apiRequest(`/courses/${id}/`);
  },

  createCourse: async (courseData: any) => {
    return apiRequest('/courses/', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  updateCourse: async (id: string, courseData: any) => {
    return apiRequest(`/courses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  deleteCourse: async (id: string) => {
    return apiRequest(`/courses/${id}/`, {
      method: 'DELETE',
    });
  },

  getCourseStats: async () => {
    return apiRequest('/courses/stats/');
  },

  // Enrollments
  getEnrollments: async (params?: { student_id?: string; course_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.course_id) queryParams.append('course_id', params.course_id);
    
    const endpoint = `/courses/enrollments/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  createEnrollment: async (enrollmentData: any) => {
    return apiRequest('/courses/enrollments/', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
  },

  updateEnrollment: async (id: string, enrollmentData: any) => {
    return apiRequest(`/courses/enrollments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(enrollmentData),
    });
  },

  // Attendance
  getAttendance: async (params?: { 
    student_id?: string; 
    course_id?: string; 
    date_from?: string; 
    date_to?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.course_id) queryParams.append('course_id', params.course_id);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const endpoint = `/attendance/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  createAttendance: async (attendanceData: any) => {
    return apiRequest('/attendance/', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  updateAttendance: async (id: string, attendanceData: any) => {
    return apiRequest(`/attendance/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  },

  getAttendanceStats: async (params?: { 
    student_id?: string; 
    course_id?: string; 
    days?: number; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.course_id) queryParams.append('course_id', params.course_id);
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const endpoint = `/attendance/stats/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  getStudentAttendanceStats: async (studentId: string, params?: { days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const endpoint = `/attendance/stats/student/${studentId}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  // Journals
  getJournalEntries: async (params?: { 
    student_id?: string; 
    entry_type?: string; 
    is_private?: boolean; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.entry_type) queryParams.append('entry_type', params.entry_type);
    if (params?.is_private !== undefined) queryParams.append('is_private', params.is_private.toString());
    
    const endpoint = `/journals/entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  createJournalEntry: async (entryData: any) => {
    return apiRequest('/journals/entries/', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  updateJournalEntry: async (id: string, entryData: any) => {
    return apiRequest(`/journals/entries/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  },

  deleteJournalEntry: async (id: string) => {
    return apiRequest(`/journals/entries/${id}/`, {
      method: 'DELETE',
    });
  },

  getJournalGoals: async (params?: { student_id?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `/journals/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  createJournalGoal: async (goalData: any) => {
    return apiRequest('/journals/goals/', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  },

  updateJournalGoal: async (id: string, goalData: any) => {
    return apiRequest(`/journals/goals/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  },

  getJournalStats: async (params?: { student_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    
    const endpoint = `/journals/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  // Reports
  generateReport: async (reportData: any) => {
    return apiRequest('/reports/generate/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  getReports: async () => {
    return apiRequest('/reports/');
  },

  getReport: async (id: string) => {
    return apiRequest(`/reports/${id}/`);
  },

  // Dashboard
  getDashboardStats: async () => {
    return apiRequest('/reports/dashboard-stats/');
  },
};

export { ApiError };