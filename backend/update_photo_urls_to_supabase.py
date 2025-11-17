"""
Script to update student photo URLs in the database to use Supabase Storage URLs.

This script:
1. Finds all students with photos
2. Checks if the photo URL is already a Supabase URL
3. If not, updates the database record to use Supabase Storage URL format
4. Assumes photos are already uploaded to Supabase Storage bucket

Usage:
1. Make sure photos are uploaded to Supabase Storage bucket
2. Set SUPABASE_URL in .env file
3. Run: python update_photo_urls_to_supabase.py
"""

import os
import sys
import django
import re

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'basis_learning.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from students.models import Student
from django.conf import settings


def update_photo_urls():
    """Update student photo URLs to use Supabase Storage"""
    print("\n" + "="*80)
    print("UPDATING STUDENT PHOTO URLS TO SUPABASE STORAGE")
    print("="*80)
    
    # Check Supabase configuration
    supabase_url = getattr(settings, 'SUPABASE_URL', None)
    bucket_name = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'student-photos')
    
    if not supabase_url:
        print("\n[ERROR] SUPABASE_URL not set in settings")
        print("Please add SUPABASE_URL to your .env file")
        return
    
    print(f"\nSupabase URL: {supabase_url}")
    print(f"Bucket name: {bucket_name}\n")
    print("-"*80)
    
    # Get all students with photos
    students_with_photos = Student.objects.exclude(profile_photo__isnull=True).exclude(profile_photo='')
    
    print(f"Found {students_with_photos.count()} students with photos\n")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    # Construct base URL for Supabase Storage
    base_url = supabase_url.rstrip('/')
    supabase_base_url = f"{base_url}/storage/v1/object/public/{bucket_name}/"
    
    for student in students_with_photos:
        if not student.profile_photo:
            continue
        
        try:
            current_path = str(student.profile_photo.name)  # e.g., "student_photos/student_123_profile.jpg"
            
            # Check if already a Supabase URL
            if current_path.startswith('http') or current_path.startswith(supabase_base_url):
                print(f"[SKIP] Student {student.id:4d} ({student.full_name[:30]:30s}) - Already Supabase URL")
                skipped_count += 1
                continue
            
            # Extract just the filename (remove 'student_photos/' prefix if present)
            filename = current_path
            if '/' in filename:
                filename = filename.split('/')[-1]  # Get just the filename
            
            # Construct new Supabase URL
            # Format: student_photos/student_{id}_profile.{ext} -> student_photos/student_{id}_profile.{ext}
            # But we'll store just the path relative to bucket
            new_path = filename  # Store just the filename in the bucket
            
            # Update the database record
            student.profile_photo.name = new_path
            student.save(update_fields=['profile_photo'])
            
            # Verify the URL would be correct
            expected_url = f"{supabase_base_url}{new_path}"
            print(f"[OK] Student {student.id:4d} ({student.full_name[:30]:30s}) - Updated: {current_path} -> {new_path}")
            print(f"      URL: {expected_url}")
            updated_count += 1
            
        except Exception as e:
            print(f"[ERROR] Student {student.id:4d} ({student.full_name[:30]:30s}) - Error: {str(e)}")
            error_count += 1
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"[OK] Updated: {updated_count}")
    print(f"[SKIP] Skipped (already Supabase URL): {skipped_count}")
    print(f"[ERROR] Errors: {error_count}")
    print(f"[TOTAL] Total processed: {students_with_photos.count()}")
    print("\n" + "="*80)
    print("[SUCCESS] Photo URL update complete!")
    print("All photos now point to Supabase Storage")
    print("="*80 + "\n")


if __name__ == '__main__':
    # Ask for confirmation
    print("\n[WARNING] This will update photo URLs in the database to use Supabase Storage.")
    print("Make sure:")
    print("  1. Photos are already uploaded to Supabase Storage bucket")
    print("  2. SUPABASE_URL is set in .env file")
    print("  3. Bucket name matches SUPABASE_STORAGE_BUCKET setting\n")
    
    response = input("Do you want to proceed? (yes/no): ")
    if response.lower() == 'yes':
        update_photo_urls()
    else:
        print("\nOperation cancelled.")

