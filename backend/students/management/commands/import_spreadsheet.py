"""
Management command to import student data from spreadsheets (CSV/Excel).

This command supports importing:
- Student databases with job information (Freesia Bloom, Bluebells Bloom)
- Daisy spreadsheet with different sections
- Job list spreadsheets

Usage:
    python manage.py import_spreadsheet <file_path> [--classroom <name>] [--batch <number>] [--sheet <sheet_name>]
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from students.models import Student, Classroom, AlumniJob
import pandas as pd
import os
import re
from decimal import Decimal, InvalidOperation


class Command(BaseCommand):
    help = 'Import student data from CSV or Excel spreadsheets'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the spreadsheet file (CSV or Excel)')
        parser.add_argument('--classroom', type=str, help='Classroom name (e.g., Freesia Bloom, Bluebells Bloom, Daisy)')
        parser.add_argument('--batch', type=int, help='Batch number')
        parser.add_argument('--sheet', type=str, help='Sheet name to import (for Excel files)')
        parser.add_argument('--skip-rows', type=int, default=0, help='Number of rows to skip at the start')
        parser.add_argument('--header-row', type=int, default=0, help='Row number containing headers (0-indexed)')

    def handle(self, *args, **options):
        file_path = options['file_path']
        classroom_name = options.get('classroom')
        batch_number = options.get('batch')
        sheet_name = options.get('sheet')
        skip_rows = options.get('skip_rows', 0)
        header_row = options.get('header_row', 0)

        if not os.path.exists(file_path):
            raise CommandError(f'File not found: {file_path}')

        self.stdout.write(f'Reading spreadsheet: {file_path}')

        try:
            # Read the spreadsheet
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, skiprows=skip_rows, header=header_row)
            else:
                # Excel file
                if sheet_name:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=skip_rows, header=header_row)
                else:
                    df = pd.read_excel(file_path, skiprows=skip_rows, header=header_row)

            self.stdout.write(f'Found {len(df)} rows in spreadsheet')

            # Get or create classroom
            classroom = None
            if classroom_name:
                # Try to find existing classroom by name first
                try:
                    if batch_number:
                        classroom = Classroom.objects.get(name=classroom_name, batch_number=batch_number)
                    else:
                        # If no batch specified, get the first one with that name
                        classroom = Classroom.objects.filter(name=classroom_name).first()
                except Classroom.DoesNotExist:
                    pass
                
                # If not found, try to get existing one by name only (ignore batch)
                if not classroom:
                    classroom = Classroom.objects.filter(name=classroom_name).first()
                
                # If still not found, create new one
                if not classroom:
                    try:
                        classroom = Classroom.objects.create(
                            name=classroom_name,
                            batch_number=batch_number,
                            is_active=True
                        )
                        self.stdout.write(self.style.SUCCESS(f'Created classroom: {classroom}'))
                    except Exception as e:
                        # If creation fails due to unique constraint, just get the existing one
                        classroom = Classroom.objects.filter(name=classroom_name).first()
                        if classroom:
                            self.stdout.write(f'Using existing classroom: {classroom} (unique constraint)')
                        else:
                            raise
                else:
                    # Update batch number if provided and different
                    if batch_number and classroom.batch_number != batch_number:
                        classroom.batch_number = batch_number
                        classroom.save()
                    self.stdout.write(f'Using existing classroom: {classroom}')

            # Detect spreadsheet format and import accordingly
            if self._is_student_database_format(df):
                self._import_student_database_format(df, classroom)
            elif self._is_daisy_format(df):
                self._import_daisy_format(df, classroom)
            else:
                self._import_generic_format(df, classroom)

            self.stdout.write(self.style.SUCCESS('Import completed successfully!'))

        except Exception as e:
            import traceback
            error_msg = f'Error importing spreadsheet: {str(e)}\n{traceback.format_exc()}'
            raise CommandError(error_msg)

    def _is_student_database_format(self, df):
        """Check if this is a student database format (with Job, Salary, Before Bloom columns)"""
        columns = [str(col).lower() for col in df.columns]
        return 'student' in columns and ('job' in columns or 'salary' in columns)

    def _is_daisy_format(self, df):
        """Check if this is a Daisy format (with sections like PPT Students, Community, etc.)"""
        # Check if any cell contains section headers
        for col in df.columns:
            for val in df[col].dropna():
                if isinstance(val, str):
                    val_lower = val.lower()
                    if 'ppt students' in val_lower or 'community' in val_lower or 'parents' in val_lower or 'staff' in val_lower:
                        return True
                elif pd.notna(val):
                    val_str = str(val)
                    val_lower = val_str.lower()
                    if 'ppt students' in val_lower or 'community' in val_lower or 'parents' in val_lower or 'staff' in val_lower:
                        return True
        return False

    def _import_student_database_format(self, df, classroom):
        """Import student database format (Freesia Bloom, Bluebells Bloom style)"""
        # Normalize column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Debug: print column names
        self.stdout.write(f'Columns found: {list(df.columns)}')
        
        # Map common column name variations
        column_mapping = {
            'si no': 'serial',
            'si no.': 'serial',
            'serial no': 'serial',
            'student': 'name',
            'student name': 'name',
            'job': 'job_title',
            'job title': 'job_title',
            'salary': 'salary',
            'before bloom': 'job_before_bloom',
            'before': 'job_before_bloom',
            'email': 'email',
            'email address': 'email',
            'first name': 'first_name',
            'last name': 'last_name',
            'phone': 'phone',
            'contact number': 'phone',
            'age': 'age',
            'address': 'address',
        }

        # Rename columns
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df.rename(columns={old_col: new_col}, inplace=True)
        
        # Debug: print column names after mapping
        self.stdout.write(f'Columns after mapping: {list(df.columns)}')

        created_count = 0
        updated_count = 0
        alumni_job_count = 0

        for idx, row in df.iterrows():
            try:
                # Extract student name
                name_val = row.get('name', '')
                if pd.isna(name_val):
                    continue
                student_name = str(name_val).strip()
                if not student_name or student_name.lower() in ['nan', 'none', '']:
                    continue

                # Split name into first and last
                name_parts = student_name.split(maxsplit=1)
                first_name = name_parts[0] if name_parts else ''
                last_name = name_parts[1] if len(name_parts) > 1 else ''

                # Generate email if not provided
                email = self._extract_email(row)
                if not email:
                    # Generate email from name
                    email_base = f"{first_name.lower()}{last_name.lower() if last_name else ''}".replace(' ', '').replace('.', '')
                    email = f"{email_base}@basislearning.net"

                # Get or create student
                student, created = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'classroom': classroom,
                        'phone': self._clean_phone(row.get('phone', '')),
                        'address': str(row.get('address', '')).strip() or None,
                    }
                )

                if not created:
                    # Update existing student
                    student.first_name = first_name
                    student.last_name = last_name
                    if classroom:
                        student.classroom = classroom
                    if row.get('phone'):
                        student.phone = self._clean_phone(row.get('phone', ''))
                    if row.get('address'):
                        student.address = str(row.get('address', '')).strip()
                    student.save()
                    updated_count += 1
                else:
                    created_count += 1

                # Determine student status based on job information
                job_title_val = row.get('job_title', '')
                if pd.isna(job_title_val):
                    job_title = ''
                else:
                    job_title = str(job_title_val).strip()
                
                # Also check for salary or other indicators of job info
                salary = self._parse_salary(row.get('salary', ''))
                job_before_bloom_val = row.get('job_before_bloom', '')
                has_job_before = False
                if not pd.isna(job_before_bloom_val):
                    job_before_str = str(job_before_bloom_val).strip().lower()
                    has_job_before = job_before_str not in ['nan', 'none', '-', '']
                
                employment_status = self._determine_employment_status(job_title)

                # If student has job info (job title, salary, or job before bloom), mark as alumni and create AlumniJob record
                has_job_info = (job_title and str(job_title).strip().lower() not in ['nan', 'none', '', '-']) or salary or has_job_before
                
                # Debug first few rows
                if idx < 3:
                    self.stdout.write(f'Row {idx}: job_title="{job_title}", salary={salary}, has_job_before={has_job_before}, has_job_info={has_job_info}')
                
                if has_job_info:
                    # Mark as alumni if not already
                    if student.status != 'alumni':
                        student.status = 'alumni'
                        student.graduation_date = timezone.now()
                        student.save()

                    # Create or update AlumniJob
                    # (salary and job_before_bloom already extracted above)
                    if pd.isna(job_before_bloom_val):
                        job_before_bloom = None
                    else:
                        job_before_bloom = str(job_before_bloom_val).strip() or None
                        if job_before_bloom and job_before_bloom.lower() in ['nan', 'none', '-', '']:
                            job_before_bloom = None

                    job_title_clean = None
                    if job_title and str(job_title).strip().lower() not in ['nan', 'none', '-', '']:
                        job_title_clean = str(job_title).strip()
                    
                    alumni_job, job_created = AlumniJob.objects.get_or_create(
                        student=student,
                        defaults={
                            'job_title': job_title_clean,
                            'salary': salary,
                            'employment_status': employment_status,
                            'job_before_bloom': job_before_bloom,
                        }
                    )

                    if not job_created:
                        alumni_job.job_title = job_title_clean
                        alumni_job.salary = salary
                        alumni_job.employment_status = employment_status
                        alumni_job.job_before_bloom = job_before_bloom
                        alumni_job.save()

                    alumni_job_count += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error processing row {idx + 1}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'Imported: {created_count} created, {updated_count} updated, {alumni_job_count} alumni jobs created/updated'
        ))

    def _import_daisy_format(self, df, classroom):
        """Import Daisy format with sections (PPT Students, Community, Parents, Staff)"""
        # This format has sections separated by header rows
        current_section = None
        created_count = 0
        updated_count = 0

        for idx, row in df.iterrows():
            # Check if this is a section header
            first_col = str(row.iloc[0]).strip() if len(row) > 0 else ''
            if first_col and any(keyword in first_col.lower() for keyword in ['ppt students', 'community', 'parents', 'staff']):
                current_section = first_col
                self.stdout.write(f'Processing section: {current_section}')
                continue

            # Skip empty rows
            if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
                continue

            try:
                # Extract data based on column positions
                # Expected columns: Sl. No, First Name, Last Name, Email Address, Age, Notes
                first_name = str(row.iloc[1]).strip() if len(row) > 1 else ''
                last_name = str(row.iloc[2]).strip() if len(row) > 2 else ''
                email = str(row.iloc[3]).strip() if len(row) > 3 else ''
                age = self._parse_age(row.iloc[5] if len(row) > 5 else None)

                if not first_name or first_name.lower() in ['nan', 'none', '']:
                    continue

                # Generate email if not provided
                if not email or email.lower() in ['nan', 'none', '']:
                    email_base = f"{first_name.lower()}{last_name.lower() if last_name else ''}".replace(' ', '').replace('.', '')
                    email = f"{email_base}@basislearning.net"

                # Determine role based on section
                role = 'student'
                if 'staff' in current_section.lower() if current_section else False:
                    role = 'staff'
                elif 'parents' in current_section.lower() if current_section else False:
                    role = 'parent'
                elif 'community' in current_section.lower() if current_section else False:
                    role = 'community'

                # Create or update student
                student, created = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'classroom': classroom,
                    }
                )

                if not created:
                    student.first_name = first_name
                    student.last_name = last_name
                    if classroom:
                        student.classroom = classroom
                    student.save()
                    updated_count += 1
                else:
                    created_count += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error processing row {idx + 1}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'Imported: {created_count} created, {updated_count} updated'
        ))

    def _import_generic_format(self, df, classroom):
        """Import generic format - try to detect columns automatically"""
        df.columns = df.columns.str.strip().str.lower()

        # Try to find name columns
        name_col = None
        email_col = None
        phone_col = None

        for col in df.columns:
            col_lower = col.lower()
            if 'name' in col_lower or 'student' in col_lower:
                name_col = col
            elif 'email' in col_lower:
                email_col = col
            elif 'phone' in col_lower or 'contact' in col_lower:
                phone_col = col

        if not name_col:
            raise CommandError('Could not detect name column in spreadsheet')

        created_count = 0
        updated_count = 0

        for idx, row in df.iterrows():
            try:
                name = str(row[name_col]).strip()
                if not name or name.lower() in ['nan', 'none', '']:
                    continue

                name_parts = name.split(maxsplit=1)
                first_name = name_parts[0] if name_parts else ''
                last_name = name_parts[1] if len(name_parts) > 1 else ''

                email = str(row[email_col]).strip() if email_col and email_col in row else None
                if not email or email.lower() in ['nan', 'none', '']:
                    email_base = f"{first_name.lower()}{last_name.lower() if last_name else ''}".replace(' ', '').replace('.', '')
                    email = f"{email_base}@basislearning.net"

                student, created = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'classroom': classroom,
                        'phone': self._clean_phone(row[phone_col]) if phone_col and phone_col in row else None,
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error processing row {idx + 1}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'Imported: {created_count} created, {updated_count} updated'
        ))

    def _extract_email(self, row):
        """Extract email from row"""
        for col in ['email', 'email address', 'email_address']:
            if col in row:
                email = str(row[col]).strip()
                if email and email.lower() not in ['nan', 'none', ''] and '@' in email:
                    return email
        return None

    def _clean_phone(self, phone):
        """Clean and format phone number"""
        if pd.isna(phone):
            return None
        phone_str = str(phone).strip()
        if not phone_str or phone_str.lower() in ['nan', 'none', '']:
            return None
        # Remove non-digit characters except +
        phone_str = re.sub(r'[^\d+]', '', phone_str)
        return phone_str if phone_str else None

    def _parse_salary(self, salary_str):
        """Parse salary string to Decimal"""
        if pd.isna(salary_str):
            return None
        salary_str = str(salary_str).strip()
        if not salary_str or salary_str.lower() in ['nan', 'none', '-', '']:
            return None
        # Remove commas and currency symbols
        salary_str = re.sub(r'[^\d.]', '', salary_str)
        try:
            return Decimal(salary_str)
        except (InvalidOperation, ValueError):
            return None

    def _parse_age(self, age_val):
        """Parse age value"""
        if pd.isna(age_val):
            return None
        try:
            return int(float(age_val))
        except (ValueError, TypeError):
            return None

    def _determine_employment_status(self, job_title):
        """Determine employment status from job title"""
        if not job_title:
            return None
        
        job_title_str = str(job_title).strip()
        if job_title_str.lower() in ['nan', 'none', '-', '']:
            return None

        job_lower = job_title_str.lower()

        if 'continuing' in job_lower or 'studies' in job_lower:
            return 'continuing_studies'
        elif 'looking' in job_lower or 'search' in job_lower:
            return 'looking'
        elif 'married' in job_lower:
            return 'married'
        elif 'settled' in job_lower:
            return 'settled'
        elif 'not working' in job_lower or 'no job' in job_lower:
            return 'not_working'
        elif job_lower and job_lower not in ['nan', 'none', '-', '']:
            return 'employed'
        else:
            return None

