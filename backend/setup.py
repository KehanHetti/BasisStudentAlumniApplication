#!/usr/bin/env python
"""
Setup script for the Basis Learning Application Django backend.
Run this script to initialize the database and create sample data.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment and run migrations."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'basis_learning.settings')
    django.setup()

def main():
    """Main setup function."""
    print("Setting up Basis Learning Application Backend...")
    
    # Setup Django
    setup_django()
    
    # Run migrations
    print("Running database migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Create superuser (optional)
    print("Creating superuser...")
    try:
        from django.contrib.auth.models import User
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            print("Superuser created: username=admin, password=admin123")
        else:
            print("Superuser already exists")
    except Exception as e:
        print(f"Error creating superuser: {e}")
    
    # Populate sample data
    print("Populating sample data...")
    try:
        execute_from_command_line(['manage.py', 'populate_sample_data'])
        print("Sample data populated successfully!")
    except Exception as e:
        print(f"Error populating sample data: {e}")
    
    print("\nSetup complete!")
    print("To start the development server, run:")
    print("  python manage.py runserver")
    print("\nAdmin interface available at: http://localhost:8000/admin/")
    print("API endpoints available at: http://localhost:8000/api/")

if __name__ == '__main__':
    main()
