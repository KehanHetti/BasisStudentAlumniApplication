# Basis Learning Application

A comprehensive student and alumni tracking platform built with Next.js and Django REST Framework, designed for educational institutions to manage students, track attendance, monitor academic progress, maintain journal entries, and generate reports.

## 🎯 Project Overview

The Basis Learning Application is a full-stack web platform that enables staff at Basis Education Foundation to efficiently manage student records, track engagement, monitor academic performance, and maintain detailed progress journals. The application features a modern, responsive UI with role-based access control and comprehensive data visualization.

## ✨ Key Features

### 🏠 Dashboard
- **Real-time Statistics**: Active students, attendance rates, enrollment metrics
- **Impact Overview**: Interactive data visualizations (employment rates, salary trends, job categories)
- **Quick Actions**: Fast access to common tasks (mark attendance, add student, view reports)
- **Recent Activity Feed**: Latest updates and events
- **Hero Section**: Personalized greeting with today's date and active student count
- **Mobile Responsive**: Fully optimized for all screen sizes

### 👥 Student Management
- **Complete Directory**: Comprehensive student profiles with photos, contact information, and status
- **Advanced Search & Filtering**: Search by name, email, or filter by status (Active, Alumni, Dropped)
- **Classroom/Course Viewing**: See which classroom each student belongs to
- **Sticky Table Headers**: Column titles remain visible while scrolling
- **Hover Interactions**: Quick action buttons appear on row hover
- **Pagination**: Efficient navigation through large student lists
- **Responsive Design**: Tables adapt gracefully to mobile screens

### 📅 Attendance System
- **Daily Tracking**: Mark attendance with multiple statuses (Present, Absent, Late, Excused)
- **Date Range Filters**: Quick preset filters (Today, This Week, Last Month) plus custom ranges
- **Summary Cards**: Total records, present count, absent count with visual indicators
- **CSV Export**: Download attendance data for external analysis
- **Empty States**: Helpful guidance when no data is available
- **Visual Feedback**: Color-coded status indicators

### 📊 Grade Management
- **GPA Tracking**: Average GPA calculation with clear display (shows 0.00 with explanation when no grades exist)
- **Course Filtering**: Filter grades by specific courses
- **Student Filtering**: View grades for specific students
- **Sort Indicators**: Visual indicators on sortable column headers
- **Progress Summary**: Overview of total enrollments, completed courses, and graded assignments
- **Empty State Handling**: Clear call-to-action when no data exists

### 📝 Journal Entries
- **Multiple Entry Types**: Progress, Achievement, Concern, Goal, General
- **Priority System**: Urgent, High, Medium, Low priority levels
- **Privacy Controls**: Toggle to show/hide private entries (admin-only visibility)
- **Date Range Filtering**: Filter entries by creation date
- **Search Functionality**: Search through entry titles and content
- **Compact View Toggle**: Switch between detailed and compact card views
- **Pagination**: Efficient loading of large datasets
- **Goal Tracking**: Set and monitor student goals with status tracking
- **Last Updated Indicators**: Shows when entries were last modified

### 📈 Reports & Analytics
- **Custom Report Generation**: Create reports with custom parameters
- **Grouped Reports**: Reports organized by date (Last 7 Days, This Month, Older)
- **Collapsible Sections**: Expandable report groups for better organization
- **Download Functionality**: Download generated reports
- **Visual Indicators**: Icons and badges for report types
- **Dashboard Statistics**: Real-time metrics and insights

### 🔐 Authentication & Security
- **Token-Based Authentication**: Secure API access with Django REST Framework tokens
- **Role-Based Access Control**: Admin, Teacher, and Student roles with appropriate permissions
- **Session Management**: Secure session handling with automatic token refresh
- **Concurrent User Support**: Multiple users can access the system simultaneously
- **Protected Routes**: Authentication guards for all sensitive pages

### 🎨 User Experience
- **Custom Toast Notifications**: Professional, animated notifications matching design system
- **Confirmation Dialogs**: Replaces browser alerts with styled confirmation modals
- **Empty States**: Helpful illustrations and guidance when no data exists
- **Loading States**: Clear feedback during data fetching
- **Error Handling**: User-friendly error messages with actionable guidance
- **Accessibility**: ARIA labels, keyboard navigation, sufficient color contrast
- **Touch Targets**: Mobile-friendly button sizes (minimum 44x44px)

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Chart.js** - Data visualization
- **React Context API** - Global state management

### Backend
- **Django 4.2+** - Python web framework
- **Django REST Framework** - RESTful API development
- **PostgreSQL** - Production database (SQLite for development)
- **Token Authentication** - Secure API authentication
- **CORS Headers** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** 12+ (for production) or SQLite (for development)
- **pip** (Python package manager)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `env.example` to `.env` (if available)
   - Update database credentials in `.env` file
   - For PostgreSQL: Set `USE_SQLITE=False` and configure PostgreSQL settings
   - For SQLite (development): Keep `USE_SQLITE=True` (default)

5. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   
   The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile

### Students
- `GET /api/students/` - List all students (with pagination)
- `POST /api/students/` - Create new student
- `GET /api/students/{id}/` - Get student details
- `PUT /api/students/{id}/` - Update student
- `DELETE /api/students/{id}/` - Delete student
- `GET /api/students/stats/` - Get student statistics
- `POST /api/students/{id}/upload-photo/` - Upload student photo

### Courses/Classrooms
- `GET /api/students/classrooms/` - List all classrooms
- `POST /api/students/classrooms/` - Create new classroom
- `GET /api/students/classrooms/{id}/` - Get classroom details
- `PUT /api/students/classrooms/{id}/` - Update classroom
- `DELETE /api/students/classrooms/{id}/` - Delete classroom

### Attendance
- `GET /api/attendance/` - List attendance records (with filtering)
- `POST /api/attendance/` - Create attendance record
- `GET /api/attendance/stats/` - Get attendance statistics
- `GET /api/attendance/{id}/` - Get attendance record details
- `PUT /api/attendance/{id}/` - Update attendance record
- `DELETE /api/attendance/{id}/` - Delete attendance record

### Journals
- `GET /api/journals/entries/` - List journal entries (with filtering)
- `POST /api/journals/entries/` - Create journal entry
- `GET /api/journals/entries/{id}/` - Get journal entry details
- `PUT /api/journals/entries/{id}/` - Update journal entry
- `DELETE /api/journals/entries/{id}/` - Delete journal entry
- `GET /api/journals/goals/` - List journal goals
- `POST /api/journals/goals/` - Create journal goal
- `GET /api/journals/goals/{id}/` - Get journal goal details
- `PUT /api/journals/goals/{id}/` - Update journal goal
- `DELETE /api/journals/goals/{id}/` - Delete journal goal
- `GET /api/journals/stats/` - Get journal statistics

### Reports
- `GET /api/reports/dashboard-stats/` - Get dashboard statistics
- `GET /api/reports/` - List all reports
- `POST /api/reports/generate/` - Generate custom report
- `GET /api/reports/{id}/` - Get report details
- `GET /api/reports/{id}/download/` - Download report
- `DELETE /api/reports/{id}/` - Delete report

## 📁 Project Structure

```
Basis-Learning-Application/
├── backend/
│   ├── basis_learning/          # Django project settings
│   │   ├── settings.py          # Main configuration
│   │   ├── urls.py              # Root URL configuration
│   │   └── wsgi.py              # WSGI configuration
│   ├── authentication/          # Authentication app
│   │   ├── models.py            # User and profile models
│   │   ├── views.py             # Authentication views
│   │   ├── serializers.py      # API serializers
│   │   └── urls.py              # Authentication URLs
│   ├── students/                # Student management app
│   ├── courses/                 # Course management app
│   ├── attendance/              # Attendance tracking app
│   ├── journals/                # Journal and goals app
│   ├── reports/                 # Reports and analytics app
│   ├── manage.py                # Django management script
│   ├── requirements.txt         # Python dependencies
│   └── setup.py                 # Setup script (if available)
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app directory
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── students/        # Student pages
│   │   │   │   └── [id]/        # Student detail page
│   │   │   ├── attendance/      # Attendance pages
│   │   │   │   └── mark/        # Mark attendance page
│   │   │   ├── progress/        # Grade management page
│   │   │   ├── journals/        # Journals page
│   │   │   ├── reports/         # Reports page
│   │   │   ├── admin/           # Admin pages
│   │   │   └── auth/            # Authentication pages
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # UI components (Card, Toast, ConfirmDialog, EmptyState)
│   │   │   ├── layout/          # Layout components (Sidebar, Topbar)
│   │   │   ├── journals/        # Journal-specific components
│   │   │   └── charts/          # Chart components
│   │   ├── contexts/            # React Context providers
│   │   │   ├── AuthContext.tsx  # Authentication context
│   │   │   └── ToastContext.tsx # Toast notification context
│   │   ├── lib/                 # Utilities and helpers
│   │   │   ├── api.ts           # API client
│   │   │   ├── apiHelpers.ts    # API helper functions
│   │   │   └── types.ts         # TypeScript type definitions
│   │   └── styles/              # Global styles
│   │       └── globals.css       # Global CSS and Tailwind
│   ├── package.json             # Node.js dependencies
│   ├── tailwind.config.ts       # Tailwind configuration
│   └── tsconfig.json            # TypeScript configuration
│
└── README.md                    # This file
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#0066CC` (logo-primary-blue)
- **Secondary Blue**: `#00A8E8` (logo-secondary-blue)
- **UI Background**: Light gray tones
- **Text Colors**: Dark gray for primary text, light gray for secondary
- **Status Colors**: Green (success), Red (error), Yellow (warning), Blue (info)

### Typography
- **Font Family**: Avenir (or system fallback)
- **Font Weights**: Medium (default), Semibold, Bold
- **Responsive Sizing**: Scales appropriately on mobile devices

### Components
- **Cards**: Elevated with shadows and hover effects
- **Buttons**: Gradient backgrounds with hover states
- **Forms**: Clean inputs with focus states
- **Tables**: Sticky headers, hover highlights, responsive design
- **Modals**: Backdrop blur with smooth animations

## 🔒 Security Features

- **Token Authentication**: Secure token-based API authentication
- **Role-Based Access Control**: Admin, Teacher, Student roles
- **CORS Configuration**: Properly configured for allowed origins
- **Input Validation**: Both frontend and backend validation
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: React automatically escapes content
- **Secure Headers**: CORS and security headers configured

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for mobile devices:

- **Collapsible Sidebar**: Hamburger menu on mobile screens
- **Responsive Tables**: Horizontal scrolling with sticky headers
- **Touch-Friendly Targets**: Minimum 44x44px for all interactive elements
- **Adaptive Layouts**: Grid systems adjust for screen size
- **Mobile Navigation**: Optimized navigation for small screens
- **Responsive Typography**: Font sizes scale appropriately

## 🧪 Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **No Console Logs**: Production code is clean of debug statements
- **Modular Components**: Large files broken into smaller, reusable components
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Adding New Features

1. **Backend (Django):**
   - Create models in appropriate app
   - Add serializers for API responses
   - Create viewsets or API views
   - Update URL patterns
   - Run migrations: `python manage.py makemigrations && python manage.py migrate`

2. **Frontend (Next.js):**
   - Create pages in `src/app/`
   - Add reusable components in `src/components/`
   - Update API client in `src/lib/api.ts`
   - Add TypeScript types in `src/lib/types.ts`
   - Follow existing patterns for consistency

### Database Migrations

When you make changes to Django models:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 🚢 Deployment

### Backend Deployment
1. Set `DEBUG=False` in production settings
2. Configure PostgreSQL database
3. Set up environment variables
4. Run `python manage.py collectstatic`
5. Use a production WSGI server (Gunicorn, uWSGI)
6. Configure reverse proxy (Nginx)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Set environment variables for API URL
4. Configure CORS on backend for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following code quality standards
4. Test thoroughly on multiple devices/browsers
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Open an issue in the GitHub repository
- Contact the development team
- Check the documentation in the codebase

## 🙏 Acknowledgments

Built for Basis Education Foundation to support student and alumni tracking, progress monitoring, and educational management.

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready
