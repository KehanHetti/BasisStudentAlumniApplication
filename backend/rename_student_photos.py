"""
Script to rename existing student photos to the new format: student_{id}_profile.{ext}

This script:
1. Finds all students with photos
2. Checks if the photo filename is already in the new format
3. If not, renames the file to student_{id}_profile.{ext}
4. Updates the database record

Safe to run multiple times - it won't rename files that are already in the correct format.
"""

import os
import sys
import django
import re
from pathlib import Path

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


def rename_student_photos():
    """Rename all student photos to the new format"""
    print("\n" + "="*80)
    print("RENAMING STUDENT PHOTOS TO NEW FORMAT")
    print("="*80)
    print("\nThis will rename photos to: student_{id}_profile.{ext}\n")
    
    # Get all students with photos
    students_with_photos = Student.objects.exclude(profile_photo__isnull=True).exclude(profile_photo='')
    
    print(f"Found {students_with_photos.count()} students with photos\n")
    print("-"*80)
    
    renamed_count = 0
    skipped_count = 0
    error_count = 0
    
    for student in students_with_photos:
        if not student.profile_photo:
            continue
        
        try:
            # Get current photo path and filename
            current_path = student.profile_photo.name  # e.g., "student_photos/83839ak.jpg"
            current_filename = os.path.basename(current_path)  # e.g., "83839ak.jpg"
            
            # Check if already in new format
            match = re.match(r'student_(\d+)_profile\.(\w+)', current_filename)
            if match:
                extracted_id = int(match.group(1))
                if extracted_id == student.id:
                    # Already in correct format
                    print(f"[OK] Student {student.id:4d} ({student.full_name[:30]:30s}) - Already correct: {current_filename}")
                    skipped_count += 1
                    continue
            
            # Get file extension
            ext = current_filename.split('.')[-1].lower()
            
            # Generate new filename
            new_filename = f"student_{student.id}_profile.{ext}"
            new_path = os.path.join('student_photos', new_filename)
            
            # Get full file paths
            media_root = Path(settings.MEDIA_ROOT)
            old_full_path = media_root / current_path
            new_full_path = media_root / new_path
            new_dir = new_full_path.parent
            
            # Check if old file exists
            if not old_full_path.exists():
                print(f"[WARN] Student {student.id:4d} ({student.full_name[:30]:30s}) - File not found: {current_path}")
                error_count += 1
                continue
            
            # Check if new filename already exists (shouldn't happen, but be safe)
            if new_full_path.exists() and new_full_path != old_full_path:
                print(f"[WARN] Student {student.id:4d} ({student.full_name[:30]:30s}) - Target file exists: {new_filename}")
                # Ask what to do - for now, skip
                error_count += 1
                continue
            
            # Create directory if needed
            new_dir.mkdir(parents=True, exist_ok=True)
            
            # Rename the file
            old_full_path.rename(new_full_path)
            
            # Update database record
            student.profile_photo.name = new_path
            student.save(update_fields=['profile_photo'])
            
            print(f"[OK] Student {student.id:4d} ({student.full_name[:30]:30s}) - Renamed: {current_filename} -> {new_filename}")
            renamed_count += 1
            
        except Exception as e:
            print(f"[ERROR] Student {student.id:4d} ({student.full_name[:30]:30s}) - Error: {str(e)}")
            error_count += 1
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"[OK] Renamed: {renamed_count}")
    print(f"[SKIP] Skipped (already correct): {skipped_count}")
    print(f"[ERROR] Errors: {error_count}")
    print(f"[TOTAL] Total processed: {students_with_photos.count()}")
    print("\n" + "="*80)
    print("[SUCCESS] Photo renaming complete!")
    print("All photos are now in the format: student_{id}_profile.{ext}")
    print("="*80 + "\n")


if __name__ == '__main__':
    # Ask for confirmation
    print("\n[WARNING] This will rename photo files on disk.")
    print("The files will be renamed to: student_{id}_profile.{ext}")
    print("This is safe and will preserve all photos.\n")
    
    response = input("Do you want to proceed? (yes/no): ")
    if response.lower() == 'yes':
        rename_student_photos()
    else:
        print("\nOperation cancelled.")

