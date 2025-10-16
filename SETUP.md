# Quick Setup Guide

## 🚀 One-Command Setup (Windows)

```bash
# Run the automated setup script
.\start.bat
```

This will:
- Set up the virtual environment
- Install all dependencies
- Configure the database
- Start both backend and frontend servers

## 🛠️ Manual Setup

### Backend (Django + PostgreSQL)

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database (copy and edit .env file)
copy env.example .env

# Setup database and sample data
python setup.py

# Start server
python manage.py runserver
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Database Configuration

### PostgreSQL (Production - Default)
- Database: `basis_learning`
- User: `basis_user`
- Password: `BasisLearning123!`
- Host: `localhost`
- Port: `5432`

### SQLite3 (Development)
- Set `USE_SQLITE=True` in `.env` file
- Database file: `db.sqlite3`

## 📱 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
  - Username: `admin`
  - Password: `admin123`

## 🎯 Features

- **Student Management**: Complete student profiles and enrollment tracking
- **Course Management**: Course creation and student enrollment
- **Attendance System**: Daily tracking with interactive charts and analytics
- **Progress Tracking**: Journal entries and goal setting
- **Reports & Analytics**: Comprehensive dashboard with real-time statistics

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check credentials in `.env` file
- Verify database exists: `basis_learning`

### Port Already in Use
- Backend (8000): Change port in `manage.py runserver 8001`
- Frontend (3000): Change port in `npm run dev -- -p 3001`

### Missing Dependencies
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`
