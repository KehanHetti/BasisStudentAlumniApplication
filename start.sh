#!/bin/bash

echo "Starting Basis Learning Application..."

echo ""
echo "Setting up Backend..."
cd backend

echo "Creating virtual environment..."
python3 -m venv .venv

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Setting up database and sample data..."
python setup.py

echo "Starting Django server..."
python manage.py runserver &
DJANGO_PID=$!

echo ""
echo "Setting up Frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install

echo "Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "Application started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:8000/admin (admin/admin123)"

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $DJANGO_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
