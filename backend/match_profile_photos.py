"""
Helper script to manually match profile photos to students.

Since profile photos may have random filenames (e.g., 12345.jpg, image_1JpYO7I.png),
they cannot be automatically matched. This script helps you:

1. List all students without photos
2. List all available photos (excluding already assigned ones)
3. Manually assign photos to students by ID
4. Automatically rename photos to include student ID (student_{id}_profile.{ext})

When you assign a photo, it will be automatically renamed to include the student ID
in the filename, so you can always identify which photo belongs to which student,
even if something goes wrong with the database.

Usage:
    python match_profile_photos.py list-students-without-photos
    python match_profile_photos.py list-available-photos
    python match_profile_photos.py assign <student_id> <photo_filename>
    python match_profile_photos.py interactive  # Interactive mode to match photos

Examples:
    # Assign photo 12345.jpg to student with ID 5
    python match_profile_photos.py assign 5 12345.jpg
    # Photo will be renamed to: student_5_profile.jpg
    
    # Assign photo 67890.jpg to student with ID 10
    python match_profile_photos.py assign 10 67890.jpg
    # Photo will be renamed to: student_10_profile.jpg
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'basis_learning.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from students.models import Student
from django.core.files import File

def list_students_without_photos():
    """List all students who don't have profile photos"""
    students = Student.objects.filter(profile_photo__isnull=True) | Student.objects.filter(profile_photo='')
    print(f"\nStudents without photos: {students.count()}\n")
    for student in students[:50]:  # Show first 50
        print(f"  ID: {student.id:4d} | {student.full_name:30s} | {student.email}")
    if students.count() > 50:
        print(f"\n  ... and {students.count() - 50} more")
    return students

def list_available_photos():
    """List all available (unassigned) photos in the student_photos directory"""
    photo_dir = os.path.join('media', 'student_photos')
    if not os.path.exists(photo_dir):
        print(f"Photo directory not found: {photo_dir}")
        return []
    
    all_photos = [f for f in os.listdir(photo_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    # Get list of already assigned photos
    assigned_photos = set()
    for student in Student.objects.exclude(profile_photo__isnull=True).exclude(profile_photo=''):
        if student.profile_photo:
            assigned_photos.add(os.path.basename(str(student.profile_photo.name)))
    
    # Filter out already assigned photos
    available_photos = [f for f in all_photos if f not in assigned_photos]
    
    print(f"\nTotal photos: {len(all_photos)}")
    print(f"Already assigned: {len(assigned_photos)}")
    print(f"Available (unassigned): {len(available_photos)}\n")
    
    if available_photos:
        print("Available photos:")
        for i, photo in enumerate(available_photos[:50], 1):  # Show first 50
            photo_path = os.path.join(photo_dir, photo)
            size = os.path.getsize(photo_path) / 1024  # Size in KB
            print(f"  {i:3d}. {photo:40s} ({size:.1f} KB)")
        if len(available_photos) > 50:
            print(f"\n  ... and {len(available_photos) - 50} more")
    else:
        print("No unassigned photos available.")
    
    return available_photos

def assign_photo(student_id, photo_filename, auto_rename=True):
    """
    Assign a photo to a student and optionally rename it to include student ID.
    
    Args:
        student_id: The ID of the student
        photo_filename: The current filename (e.g., '12345.jpg')
        auto_rename: If True, rename the photo to student_{id}_profile.{ext} format
    """
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        print(f"❌ Student with ID {student_id} not found")
        return False
    
    photo_path = os.path.join('media', 'student_photos', photo_filename)
    if not os.path.exists(photo_path):
        print(f"❌ Photo file not found: {photo_path}")
        return False
    
    # Check if photo is already assigned to another student
    existing_student = Student.objects.exclude(id=student_id).filter(
        profile_photo__icontains=photo_filename
    ).first()
    if existing_student:
        print(f"⚠️  Warning: This photo is already assigned to {existing_student.full_name} (ID: {existing_student.id})")
        response = input("Do you want to reassign it? (yes/no): ")
        if response.lower() != 'yes':
            return False
    
    # Get file extension from original filename
    ext = photo_filename.split('.')[-1].lower()
    
    # Django's upload_to function will automatically generate: student_{id}_profile.{ext}
    # We just need to pass the original filename so Django can extract the extension
    # The upload_to function in models.py will handle the renaming based on student.id
    
    # Delete old photo if student already has one
    if student.profile_photo:
        old_photo_path = student.profile_photo.path
        if os.path.exists(old_photo_path):
            try:
                os.remove(old_photo_path)
                print(f"🗑️  Removed old photo: {os.path.basename(old_photo_path)}")
            except Exception as e:
                print(f"⚠️  Could not remove old photo: {e}")
    
    # Assign the photo - Django's upload_to will automatically rename it
    with open(photo_path, 'rb') as f:
        # Pass the original filename - Django's upload_to function will generate the new name
        student.profile_photo.save(photo_filename, File(f), save=True)
    
    # Expected new filename format
    expected_new_name = f"student_{student_id}_profile.{ext}"
    print(f"📝 Photo renamed to: {expected_new_name}")
    
    # Remove the old random-numbered file if it still exists and is different
    if photo_filename != os.path.basename(student.profile_photo.name) and os.path.exists(photo_path):
        try:
            os.remove(photo_path)
            print(f"🗑️  Removed old file: {photo_filename}")
        except Exception as e:
            print(f"⚠️  Could not remove old file {photo_filename}: {e}")
    
    print(f"✅ Assigned photo to {student.full_name} (ID: {student.id})")
    print(f"   Photo saved as: {student.profile_photo.name}")
    return True

def interactive_mode():
    """Interactive mode to help match photos to students"""
    print("\n" + "="*80)
    print("INTERACTIVE PHOTO MATCHING")
    print("="*80)
    print("\nThis will help you match profile photos to students.")
    print("Photos will be automatically renamed to include student ID for easy identification.")
    print("Format: student_{id}_profile.{ext}\n")
    
    students_without_photos = list(Student.objects.filter(profile_photo__isnull=True) | Student.objects.filter(profile_photo=''))
    
    photo_dir = os.path.join('media', 'student_photos')
    if not os.path.exists(photo_dir):
        print(f"❌ Photo directory not found: {photo_dir}")
        return
    
    all_photos = [f for f in os.listdir(photo_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    # Filter out photos that are already in the new format (already assigned)
    # and photos that are already assigned to students
    assigned_photos = set()
    for student in Student.objects.exclude(profile_photo__isnull=True).exclude(profile_photo=''):
        if student.profile_photo:
            assigned_photos.add(os.path.basename(str(student.profile_photo.name)))
    
    available_photos = [f for f in all_photos if f not in assigned_photos]
    
    if not students_without_photos:
        print("✅ All students already have photos!")
        return
    
    if not available_photos:
        print("❌ No unassigned photos available in media/student_photos/")
        return
    
    print(f"\nFound {len(students_without_photos)} students without photos")
    print(f"Found {len(available_photos)} available photos to assign\n")
    
    print("="*80)
    print("STUDENTS WITHOUT PHOTOS:")
    print("="*80)
    for student in students_without_photos[:30]:
        print(f"  ID: {student.id:4d} | {student.full_name:30s} | {student.email}")
    if len(students_without_photos) > 30:
        print(f"\n  ... and {len(students_without_photos) - 30} more")
    
    print("\n" + "="*80)
    print("AVAILABLE PHOTOS (random-numbered or unassigned):")
    print("="*80)
    for i, photo in enumerate(available_photos[:30], 1):
        photo_path = os.path.join(photo_dir, photo)
        size = os.path.getsize(photo_path) / 1024  # Size in KB
        print(f"  {i:3d}. {photo:40s} ({size:.1f} KB)")
    if len(available_photos) > 30:
        print(f"\n  ... and {len(available_photos) - 30} more")
    
    print("\n" + "="*80)
    print("\nTo assign a photo, use:")
    print("  python match_profile_photos.py assign <student_id> <photo_filename>")
    print("\nThe photo will be automatically renamed to: student_{id}_profile.{ext}")
    print("This ensures you can identify which photo belongs to which student!")
    print("\nExample:")
    print("  python match_profile_photos.py assign 1 12345.jpg")
    print("  → Photo will be renamed to: student_1_profile.jpg")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1].lower()
    
    if command == 'list-students-without-photos' or command == 'list-students':
        list_students_without_photos()
    elif command == 'list-available-photos' or command == 'list-photos':
        list_available_photos()
    elif command == 'assign':
        if len(sys.argv) < 4:
            print("Usage: python match_profile_photos.py assign <student_id> <photo_filename>")
            return
        student_id = int(sys.argv[2])
        photo_filename = sys.argv[3]
        assign_photo(student_id, photo_filename)
    elif command == 'interactive' or command == 'i':
        interactive_mode()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)

if __name__ == '__main__':
    main()

