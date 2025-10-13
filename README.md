# Basis Learning Application

A comprehensive learning management system built with Next.js frontend and Django backend, designed for educational institutions to manage students, courses, attendance, and progress tracking.

## Features

### 🎓 Student Management
- Complete student profiles with contact information
- Student status tracking (Active, Graduated, Dropped, Suspended)
- Search and filter capabilities
- Student enrollment history

### 📚 Course Management
- Course creation and management
- Course levels (Beginner, Intermediate, Advanced)
- Student enrollment tracking
- Course completion monitoring

### 📊 Attendance System
- Daily attendance tracking
- Multiple attendance statuses (Present, Absent, Late, Excused)
- Attendance statistics and reporting
- Export functionality

### 📝 Journal & Progress Tracking
- Student progress journal entries
- Goal setting and tracking
- Multiple entry types (Progress, Achievement, Concern, General)
- Priority-based organization

### 📈 Reports & Analytics
- Comprehensive dashboard with real-time statistics
- Custom report generation
- Export capabilities (CSV, JSON)
- Attendance analytics
- Student progress reports

## Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API development
- **SQLite** - Database (development)
- **CORS Headers** - Cross-origin resource sharing

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- pip (Python package manager)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   
   # Windows
   .\.venv\Scripts\activate
   
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup database and create sample data:**
   ```bash
   python setup.py
   ```

5. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

   The backend will be available at `http://localhost:8000`

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

## API Endpoints

### Students
- `GET /api/students/` - List all students
- `POST /api/students/` - Create new student
- `GET /api/students/{id}/` - Get student details
- `PUT /api/students/{id}/` - Update student
- `DELETE /api/students/{id}/` - Delete student
- `GET /api/students/stats/` - Get student statistics

### Courses
- `GET /api/courses/` - List all courses
- `POST /api/courses/` - Create new course
- `GET /api/courses/{id}/` - Get course details
- `PUT /api/courses/{id}/` - Update course
- `DELETE /api/courses/{id}/` - Delete course

### Attendance
- `GET /api/attendance/` - List attendance records
- `POST /api/attendance/` - Create attendance record
- `GET /api/attendance/stats/` - Get attendance statistics

### Journals
- `GET /api/journals/entries/` - List journal entries
- `POST /api/journals/entries/` - Create journal entry
- `GET /api/journals/goals/` - List goals
- `POST /api/journals/goals/` - Create goal

### Reports
- `GET /api/reports/dashboard-stats/` - Get dashboard statistics
- `POST /api/reports/generate/` - Generate custom report

## Project Structure

```
Basis-Learning-Application/
├── backend/
│   ├── basis_learning/          # Django project settings
│   ├── students/                # Student management app
│   ├── courses/                 # Course management app
│   ├── attendance/              # Attendance tracking app
│   ├── journals/                # Journal and goals app
│   ├── reports/                 # Reports and analytics app
│   ├── manage.py               # Django management script
│   ├── requirements.txt        # Python dependencies
│   └── setup.py               # Setup script
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   │   ├── students/      # Student pages
│   │   │   ├── attendance/    # Attendance page
│   │   │   ├── progress/      # Progress tracking page
│   │   │   ├── journals/      # Journals page
│   │   │   └── reports/       # Reports page
│   │   ├── components/        # Reusable components
│   │   ├── lib/              # Utilities and API client
│   │   └── styles/           # Global styles
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.ts    # Tailwind configuration
└── README.md
```

## Features Overview

### Dashboard
- Real-time statistics overview
- Recent student activity feed
- Attendance analytics
- Quick access to all modules

### Student Management
- Complete student directory
- Advanced search and filtering
- Student profile management
- Enrollment tracking

### Attendance System
- Daily attendance marking
- Multiple attendance statuses
- Statistical analysis
- Export capabilities

### Progress Tracking
- Course completion monitoring
- Goal setting and tracking
- Progress journal entries
- Achievement tracking

### Reports & Analytics
- Custom report generation
- Data export functionality
- Comprehensive analytics
- Visual data representation

## Development

### Adding New Features

1. **Backend (Django):**
   - Create new models in appropriate app
   - Add serializers for API responses
   - Create views for API endpoints
   - Update URL patterns

2. **Frontend (Next.js):**
   - Create new pages in `src/app/`
   - Add components in `src/components/`
   - Update API client in `src/lib/api.ts`
   - Add types in `src/lib/types.ts`

### Database Migrations

When you make changes to Django models:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Sample Data

The application comes with sample data for testing. To regenerate it:

```bash
cd backend
python manage.py populate_sample_data
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
