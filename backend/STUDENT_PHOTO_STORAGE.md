# Student Profile Photo Storage

## Storage Location

Student profile photos are stored in:
```
backend/media/student_photos/
```

This directory is configured in `backend/basis_learning/settings.py`:
- `MEDIA_ROOT = BASE_DIR / 'media'` - Base directory for all media files
- `MEDIA_URL = '/media/'` - URL prefix for serving media files

## Photo Association with Students

### Database Association

Each student record in the database has a `profile_photo` field that stores the file path relative to `MEDIA_ROOT`. For example:
- Database value: `student_photos/student_123_profile.jpg`
- Full file path: `backend/media/student_photos/student_123_profile.jpg`
- URL: `http://your-domain.com/media/student_photos/student_123_profile.jpg`

### Filename Format (New System)

**Starting from the update, all new photos will use this format:**
```
student_{student_id}_profile.{extension}
```

Examples:
- `student_123_profile.jpg` - Photo for student with ID 123
- `student_456_profile.png` - Photo for student with ID 456

**Benefits:**
- ✅ Easy to identify which photo belongs to which student by filename alone
- ✅ Even if database is corrupted, you can match photos to students
- ✅ No more random filenames like `image_1JpYO7I.png`

### Legacy Photos (Random-Numbered or Random Filenames)

**Photos with random filenames (e.g., `12345.jpg`, `67890.jpg`, `image_1JpYO7I.png`):**
- If you have photos with random numbers or random filenames, use the `match_profile_photos.py` script
- When you assign a photo to a student, it will **automatically be renamed** to include the student ID
- Example: `12345.jpg` assigned to student ID 5 → becomes `student_5_profile.jpg`
- This ensures you can always identify which photo belongs to which student, even if the database is lost

**To assign random-numbered photos:**
```bash
# List students without photos
python match_profile_photos.py list-students-without-photos

# List available (unassigned) photos
python match_profile_photos.py list-available-photos

# Assign a photo (it will be automatically renamed)
python match_profile_photos.py assign 5 12345.jpg
# → Photo 12345.jpg will be renamed to student_5_profile.jpg

# Interactive mode to see all students and photos
python match_profile_photos.py interactive
```

## How It Works

### When Uploading a Photo

1. **New Student (no ID yet):**
   - Photo is initially saved as `student_new_profile.{ext}`
   - After student is saved and gets an ID, the file is automatically renamed to `student_{id}_profile.{ext}`
   - Database record is updated with the correct filename

2. **Existing Student:**
   - Photo is saved directly as `student_{id}_profile.{ext}`
   - If student already has a photo, the old one is replaced

### Database Storage

The `Student` model stores the photo path in the `profile_photo` field:
```python
profile_photo = models.ImageField(
    upload_to=student_photo_upload_path, 
    blank=True, 
    null=True
)
```

The database stores the relative path (e.g., `student_photos/student_123_profile.jpg`), and Django automatically:
- Serves the file at `/media/student_photos/student_123_profile.jpg`
- Provides the full URL via `student.profile_photo.url`

## Recovery: Identifying Photos Without Database

### If Database is Lost/Corrupted

Even if you lose the database, you can identify photos:

1. **New Format Photos:**
   - Filename contains student ID: `student_123_profile.jpg` → Student ID: 123
   - You can recreate the association by parsing the filename

2. **Legacy Random Filenames (e.g., `12345.jpg`):**
   - If photos are still in random format, you'll need to manually match them
   - Use the `match_profile_photos.py` script to assign and rename them
   - Once assigned, they'll be renamed to include the student ID
   - After renaming, you can identify them by filename (see "New Format Photos" above)

### Recovery Script

You can create a script to extract student IDs from filenames:

```python
import os
import re

def extract_student_ids_from_photos(photo_dir='media/student_photos'):
    """Extract student IDs from photo filenames"""
    photos = {}
    for filename in os.listdir(photo_dir):
        # Match new format: student_{id}_profile.{ext}
        match = re.match(r'student_(\d+)_profile\.(\w+)', filename)
        if match:
            student_id = int(match.group(1))
            photos[student_id] = filename
        else:
            # Legacy format - no ID in filename
            photos[filename] = None
    return photos
```

## API Endpoints

### Upload Photo
```
POST /api/students/{id}/upload-photo/
Content-Type: multipart/form-data
Body: { profile_photo: <file> }
```

### Get Student (includes photo URL)
```
GET /api/students/{id}/
Response: {
    ...
    "profile_photo": "student_photos/student_123_profile.jpg",
    "profile_photo_url": "http://domain.com/media/student_photos/student_123_profile.jpg"
}
```

## Best Practices

1. **Backup Strategy:**
   - Regularly backup both the database AND the `media/student_photos/` directory
   - The database contains the association, but photos are stored separately

2. **File Management:**
   - Old photos are automatically replaced when uploading a new one
   - Consider implementing a cleanup script for orphaned photos (photos without database records)

3. **Cloud Storage (Production):**
   - For production, consider using cloud storage (AWS S3, Google Cloud Storage, etc.)
   - Update `DEFAULT_FILE_STORAGE` in settings.py
   - Filenames will still contain student IDs for easy identification

## Migration Notes

- **Existing photos:** Will continue to work as-is
- **New uploads:** Will automatically use the new naming format
- **No migration needed:** The change is backward compatible

## Troubleshooting

### Photo Not Showing
1. Check file exists: `ls backend/media/student_photos/student_{id}_profile.*`
2. Check database: `SELECT id, profile_photo FROM students_student WHERE id={id}`
3. Check MEDIA_URL and MEDIA_ROOT settings
4. Check file permissions

### Orphaned Photos
Photos that exist in the filesystem but have no database record can be found with:
```python
# Find photos without database records
import os
from students.models import Student

all_photos = set(os.listdir('media/student_photos'))
db_photos = set(
    str(s.profile_photo.name).split('/')[-1] 
    for s in Student.objects.exclude(profile_photo='')
)
orphaned = all_photos - db_photos
```

