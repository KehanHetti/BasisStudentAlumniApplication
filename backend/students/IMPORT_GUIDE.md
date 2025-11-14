# Student Data Import Guide

This guide explains how to import student data from spreadsheets into the Basis Learning Application.

## Prerequisites

1. Install required packages:
   ```bash
   pip install pandas openpyxl
   ```

2. Run migrations to create the new database tables:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Import Command Usage

The import command supports multiple spreadsheet formats and can automatically detect the format.

### Basic Usage

```bash
python manage.py import_spreadsheet <file_path> [options]
```

### Options

- `--classroom <name>`: Specify the classroom name (e.g., "Freesia Bloom", "Bluebells Bloom", "Daisy")
- `--batch <number>`: Specify the batch number (optional)
- `--sheet <sheet_name>`: For Excel files, specify which sheet to import
- `--skip-rows <number>`: Number of rows to skip at the start (default: 0)
- `--header-row <number>`: Row number containing headers (0-indexed, default: 0)

## Supported Spreadsheet Formats

### 1. Student Database Format (Freesia Bloom, Bluebells Bloom)

This format includes columns like:
- Student (or Name)
- Job (or Job Title)
- Salary
- Before Bloom

**Example:**
```bash
python manage.py import_spreadsheet "Freesia Bloom Batch 1.xlsx" --classroom "Freesia Bloom" --batch 1
```

### 2. Daisy Format

This format has sections separated by headers:
- PPT Students
- Community
- Parents
- Staff

**Example:**
```bash
python manage.py import_spreadsheet "Daisy 1.xlsx" --classroom "Daisy" --batch 1
```

### 3. Generic Format

The command will attempt to auto-detect columns for:
- Name/Student
- Email
- Phone/Contact

**Example:**
```bash
python manage.py import_spreadsheet "students.csv" --classroom "Generic Classroom"
```

## Import Process

1. **Classroom Creation**: If a classroom name is provided, it will be created automatically if it doesn't exist.

2. **Student Creation/Update**: 
   - Students are matched by email address
   - If email exists, the student record is updated
   - If email doesn't exist, a new student is created

3. **Alumni Job Tracking**:
   - If a student has job information, they are automatically marked as alumni
   - An AlumniJob record is created/updated with:
     - Job title
     - Employer
     - Salary
     - Employment status
     - Job before Bloom

4. **Email Generation**: If email is not provided, it's automatically generated from the student's name in the format: `firstnamelastname@basislearning.net`

## File Location

**Recommended:** Place your `.xlsx` or `.csv` files in the `backend/data/` folder for easy access.

You can also use any file path - the import command accepts both relative and absolute paths.

## Examples

### Import Freesia Bloom Batch 1
```bash
# From the backend directory
python manage.py import_spreadsheet "data/Freesia Bloom Batch 1.xlsx" --classroom "Freesia Bloom" --batch 1 --skip-rows 2
```

### Import Bluebells Bloom Batch 1
```bash
python manage.py import_spreadsheet "data/Bluebells Bloom Batch 1.xlsx" --classroom "Bluebells Bloom" --batch 1 --skip-rows 2
```

### Import Daisy with specific sheet
```bash
python manage.py import_spreadsheet "data/Daisy 1.xlsx" --classroom "Daisy" --sheet "Sheet1"
```

### Using absolute paths
```bash
python manage.py import_spreadsheet "C:/Users/YourName/Documents/spreadsheets/Freesia Bloom.xlsx" --classroom "Freesia Bloom" --batch 1
```

## Data Mapping

### Employment Status Detection

The import command automatically determines employment status from job titles:
- "Continuing studies" → `continuing_studies`
- "Looking for job" → `looking`
- "Married" → `married`
- "Settled" → `settled`
- "Not working" / "No job" → `not_working`
- Other job titles → `employed`

### Salary Parsing

Salaries are automatically parsed from various formats:
- "12,000" → 12000.00
- "15,000" → 15000.00
- Removes commas and currency symbols

## Troubleshooting

### Common Issues

1. **"File not found"**: Ensure the file path is correct and the file exists.

2. **"Could not detect name column"**: The spreadsheet format might not be recognized. Try using `--skip-rows` or `--header-row` to adjust the starting position.

3. **Duplicate emails**: The system uses email as a unique identifier. If duplicates are found, existing records will be updated.

4. **Missing data**: Empty cells are handled gracefully. Missing emails are auto-generated, and missing optional fields are set to null.

## After Import

After importing data, you can:

1. **View in Admin Panel**: 
   - Navigate to `/admin/students/student/`
   - Filter by classroom to see imported students
   - Check alumni jobs at `/admin/students/alumnijob/`

2. **View via API**:
   - List students: `GET /api/students/?classroom=<id>`
   - List classrooms: `GET /api/students/classrooms/`
   - List alumni jobs: `GET /api/students/alumni-jobs/?classroom=<id>`

3. **Verify Data**: Check that:
   - All students are assigned to the correct classroom
   - Alumni students have job records
   - Email addresses are correctly formatted

## Notes

- The import process is idempotent - you can run it multiple times safely
- Existing students will be updated, not duplicated
- Alumni job records are created/updated automatically for students with job information
- Profile photos are not imported automatically - these need to be uploaded separately

