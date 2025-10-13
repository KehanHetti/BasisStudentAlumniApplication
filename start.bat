@echo off
echo Starting Basis Learning Application...

echo.
echo Setting up Backend...
cd backend

echo Creating virtual environment...
python -m venv .venv

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo Setting up database and sample data...
python setup.py

echo Starting Django server...
start "Django Backend" cmd /k "python manage.py runserver"

echo.
echo Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
npm install

echo Starting Next.js development server...
start "Next.js Frontend" cmd /k "npm run dev"

echo.
echo Application started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Admin: http://localhost:8000/admin (admin/admin123)

pause
