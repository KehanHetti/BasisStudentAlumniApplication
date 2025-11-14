"""
Management command to import students from the parsed text file.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from students.models import Student, Classroom, AlumniJob
import re


class Command(BaseCommand):
    help = 'Import students from parsed text file'

    def add_arguments(self, parser):
        parser.add_argument('text_file', type=str, help='Path to the text file')

    def handle(self, *args, **options):
        text_file = options['text_file']
        
        try:
            with open(text_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {text_file}'))
            return
        
        # Parse the content
        self.stdout.write('Parsing text file...')
        students_data = self._parse_text(content)
        
        self.stdout.write(f'Found {len(students_data)} students to import')
        
        created_students = 0
        updated_students = 0
        created_jobs = 0
        updated_jobs = 0
        
        for student_info in students_data:
            try:
                # Get or create classroom
                classroom_name = student_info['classroom']
                batch_number = student_info.get('batch')
                
                # Try to find existing classroom
                classroom = None
                if batch_number:
                    classroom = Classroom.objects.filter(name=classroom_name, batch_number=batch_number).first()
                else:
                    # If no batch, try to find any classroom with that name
                    classroom = Classroom.objects.filter(name=classroom_name).first()
                
                # If not found, try to create (handle unique constraint)
                if not classroom:
                    try:
                        classroom = Classroom.objects.create(
                            name=classroom_name,
                            batch_number=batch_number,
                            is_active=True
                        )
                    except Exception:
                        # If creation fails due to unique constraint, just get existing one
                        classroom = Classroom.objects.filter(name=classroom_name).first()
                        if not classroom:
                            raise
                
                # Parse student name - handle formats like "Sneha.R" or "John, Doe"
                student_name = student_info['name'].strip()
                
                # First try splitting by comma (Last, First format)
                if ',' in student_name:
                    name_parts = student_name.split(',', 1)
                    first_name = name_parts[1].strip() if len(name_parts) > 1 else name_parts[0].strip()
                    last_name = name_parts[0].strip()
                # Then try splitting by period (First.Last format like "Sneha.R")
                elif '.' in student_name:
                    name_parts = student_name.split('.', 1)
                    first_name = name_parts[0].strip()
                    last_name = name_parts[1].strip() if len(name_parts) > 1 else ''
                # Otherwise, try splitting by space
                elif ' ' in student_name:
                    name_parts = student_name.rsplit(' ', 1)  # Split from right to get last word as last name
                    first_name = name_parts[0].strip()
                    last_name = name_parts[1].strip() if len(name_parts) > 1 else ''
                else:
                    # Single name - use as first name
                    first_name = student_name
                    last_name = ''
                
                # Get or generate email
                email = student_info.get('email')
                if not email or email == 'N/A':
                    # Generate email from name
                    email_base = f"{first_name.lower()}{last_name.lower() if last_name else ''}".replace(' ', '').replace('.', '').replace(',', '')
                    email = f"{email_base}@basislearning.net"
                
                # Create or update student
                student, created = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'classroom': classroom,
                        'status': 'active',
                    }
                )
                
                if not created:
                    student.first_name = first_name
                    student.last_name = last_name
                    student.classroom = classroom
                    student.save()
                    updated_students += 1
                else:
                    created_students += 1
                
                # Handle job status
                job_status = student_info.get('job_status', '').strip()
                if job_status and job_status.upper() != 'N/A':
                    # Mark as alumni
                    if student.status != 'alumni':
                        student.status = 'alumni'
                        student.graduation_date = timezone.now()
                        student.save()
                    
                    # Determine employment status
                    employment_status = self._determine_employment_status(job_status)
                    
                    # Extract job title from job status
                    job_title = job_status
                    if 'Continuing the studies' in job_status:
                        job_title = None
                    elif '/PPT Student' in job_status:
                        job_title = None
                        job_status = job_status.replace('/PPT Student', '').strip()
                    
                    # Create or update AlumniJob
                    alumni_job, job_created = AlumniJob.objects.get_or_create(
                        student=student,
                        defaults={
                            'job_title': job_title,
                            'employment_status': employment_status,
                        }
                    )
                    
                    if not job_created:
                        alumni_job.job_title = job_title
                        alumni_job.employment_status = employment_status
                        alumni_job.save()
                        updated_jobs += 1
                    else:
                        created_jobs += 1
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error processing {student_info.get("name", "unknown")}: {str(e)}'))
                continue
        
        self.stdout.write(self.style.SUCCESS(
            f'\nImport complete:\n'
            f'  Students: {created_students} created, {updated_students} updated\n'
            f'  Alumni Jobs: {created_jobs} created, {updated_jobs} updated'
        ))

    def _parse_text(self, content):
        """Parse the text file content into structured data"""
        students = []
        current_classroom = None
        current_batch = None
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip separator lines
            if line.startswith('---'):
                continue
                
            # Check for classroom/batch headers
            if line.startswith('##') and not line.startswith('###'):
                # Extract classroom name - handle both "## Freesia Bloom (Batches 1-5)" and "## Freesia Bloom 6"
                # Remove the ## prefix
                line_content = line[2:].strip()
                
                # Check if it's "Freesia Bloom 6" or "Daisy 1" format (classroom name followed by batch number)
                classroom_match = re.match(r'(.+?)\s+(\d+)$', line_content)
                if classroom_match:
                    current_classroom = classroom_match.group(1).strip()
                    current_batch = int(classroom_match.group(2))
                else:
                    # Handle "Freesia Bloom (Batches 1-5)" format
                    match = re.match(r'(.+?)(?:\s*\(.*?\))?$', line_content)
                    if match:
                        current_classroom = match.group(1).strip()
                        # Reset batch when we see a new main section (will be set by ### Batch)
                        current_batch = None
                continue
            elif line.startswith('###'):
                # Extract batch number from sub-header like "### Batch 1"
                match = re.search(r'Batch\s+(\d+)', line, re.IGNORECASE)
                if match:
                    current_batch = int(match.group(1))
                # For sections like "PPT Students", "Community", etc., keep current batch
                # (don't reset it, just continue with the current batch)
                continue
            
            # Parse student line
            if line.startswith('Student Name:'):
                # Extract student information with more robust regex
                # Format: Student Name: <name>, Email: <email>, Job Status: <status>
                name_match = re.search(r'Student Name:\s*(.+?)(?:,\s*Email:|$)', line)
                email_match = re.search(r'Email:\s*([^,]+?)(?:,\s*Job Status:|$)', line)
                job_match = re.search(r'Job Status:\s*(.+?)$', line)
                
                if name_match and current_classroom:  # Only add if we have a classroom
                    student_name = name_match.group(1).strip()
                    student_email = email_match.group(1).strip() if email_match else 'N/A'
                    job_status = job_match.group(1).strip() if job_match else 'N/A'
                    
                    student_data = {
                        'classroom': current_classroom,
                        'batch': current_batch,
                        'name': student_name,
                        'email': student_email,
                        'job_status': job_status,
                    }
                    students.append(student_data)
                elif name_match and not current_classroom:
                    # Log warning for students without classroom context
                    self.stdout.write(self.style.WARNING(
                        f'Skipping student "{name_match.group(1).strip()}" - no classroom context'
                    ))
        
        return students

    def _determine_employment_status(self, job_status):
        """Determine employment status from job status string"""
        if not job_status:
            return None
        
        job_lower = job_status.lower()
        
        if 'continuing the studies' in job_lower or 'studies' in job_lower:
            return 'continuing_studies'
        elif 'looking for' in job_lower or 'looking' in job_lower:
            return 'looking'
        elif 'married' in job_lower:
            return 'married'
        elif 'settled' in job_lower:
            return 'settled'
        elif 'not working' in job_lower or 'not allow' in job_lower:
            return 'not_working'
        elif 'have' in job_lower and 'baby' in job_lower:
            return 'not_working'
        elif job_lower and job_lower != 'n/a':
            return 'employed'
        else:
            return None

