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
                
                # Parse student name - handle formats like "Sneha.R" or "John, Doe" or use provided first/last name
                if 'first_name' in student_info and 'last_name' in student_info:
                    # New format already has first_name and last_name
                    first_name = student_info['first_name'].strip()
                    last_name_raw = student_info.get('last_name', '').strip()
                    # Treat "N/A" as empty string for last name
                    if last_name_raw.upper() == 'N/A' or last_name_raw == '':
                        last_name = ''
                    else:
                        last_name = last_name_raw
                else:
                    # Old format - parse from name
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
                if not email or email.upper() == 'N/A':
                    # Generate email from name - handle cases where names might be similar
                    first_clean = first_name.lower().replace(' ', '').replace('.', '').replace(',', '').strip()
                    last_clean = last_name.lower().replace(' ', '').replace('.', '').replace(',', '').strip() if last_name else ''
                    email_base = f"{first_clean}{last_clean}"
                    # If email_base is empty or just spaces, use a fallback
                    if not email_base:
                        email_base = f"student{student_info.get('name', 'unknown').lower().replace(' ', '')}"
                    
                    # Check if this email already exists and add a counter if needed
                    base_email = f"{email_base}@basislearning.net"
                    email = base_email
                    counter = 1
                    while Student.objects.filter(email=email).exists():
                        email = f"{email_base}{counter}@basislearning.net"
                        counter += 1
                        # Safety check to avoid infinite loop
                        if counter > 1000:
                            # Use a unique identifier instead
                            import uuid
                            email = f"{email_base}{uuid.uuid4().hex[:8]}@basislearning.net"
                            break
                
                # Create or update student
                # Try to find by email first, but if email would be duplicate, use a combination approach
                # For now, we'll use email as unique identifier and update if exists
                try:
                    student = Student.objects.get(email=email)
                    # Student exists - update it
                    student.first_name = first_name
                    student.last_name = last_name
                    student.classroom = classroom
                    student.status = 'active'  # Ensure status is active
                    student.save()
                    updated_students += 1
                except Student.DoesNotExist:
                    # Create new student
                    student = Student.objects.create(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        classroom=classroom,
                        status='active',
                    )
                    created_students += 1
                except Student.MultipleObjectsReturned:
                    # Multiple students with same email - update the first one
                    student = Student.objects.filter(email=email).first()
                    student.first_name = first_name
                    student.last_name = last_name
                    student.classroom = classroom
                    student.status = 'active'
                    student.save()
                    updated_students += 1
                
                # Handle job status
                job_status = student_info.get('job_status', '').strip()
                salary = student_info.get('salary')
                before_bloom = student_info.get('before_bloom', '').strip()
                
                # Update student fields directly
                if salary:
                    student.salary = salary
                if before_bloom and before_bloom.upper() != 'N/A':
                    student.job_before_bloom = before_bloom
                
                # Handle "Continuing the studies" - put in notes, don't mark as alumni
                is_continuing_studies = 'Continuing the studies' in job_status or '/PPT Student' in job_status
                if is_continuing_studies:
                    # Add to notes if not already there
                    notes_text = job_status
                    if '/PPT Student' in job_status:
                        notes_text = job_status.replace('/PPT Student', '').strip()
                    if student.notes:
                        if notes_text not in student.notes:
                            student.notes = f"{student.notes}\n{notes_text}"
                    else:
                        student.notes = notes_text
                    # Keep status as active, don't mark as alumni
                    student.status = 'active'  # Ensure status is active
                    student.save()
                elif job_status and job_status.upper() != 'N/A':
                    # Store job information but keep student as active (not alumni)
                    # Don't mark as alumni - keep status as active
                    student.status = 'active'
                    
                    # Update current_job field on student
                    student.current_job = job_status
                    
                    # Determine employment status
                    employment_status = self._determine_employment_status(job_status)
                    
                    # Extract job title from job status
                    job_title = job_status
                    
                    # Store job information in AlumniJob for tracking, but student remains active
                    # Note: AlumniJob has a limit_choices_to={'status': 'alumni'}, so we can't create it
                    # Instead, we'll just store the job info in the student's current_job field
                    # and update salary/before_bloom on the student directly
                    student.save()
                else:
                    student.status = 'active'  # Ensure status is active
                    student.save()
                
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
                # Extract classroom name - handle both "## Freesia Bloom (Batches 1-5)" and "## Freesia Bloom 6" and "## FREESIA BLOOM ##"
                # Remove the ## prefix and suffix
                line_content = line[2:].strip()
                # Remove trailing ## if present
                if line_content.endswith('##'):
                    line_content = line_content[:-2].strip()
                
                # Check if it's "Freesia Bloom 6" or "Daisy 1" format (classroom name followed by batch number)
                classroom_match = re.match(r'(.+?)\s+(\d+)$', line_content)
                if classroom_match:
                    current_classroom = classroom_match.group(1).strip()
                    current_batch = int(classroom_match.group(2))
                else:
                    # Handle "Freesia Bloom (Batches 1-5)" or "FREESIA BLOOM" format
                    match = re.match(r'(.+?)(?:\s*\(.*?\))?$', line_content)
                    if match:
                        current_classroom = match.group(1).strip()
                        # Reset batch when we see a new main section (will be set by ### Batch or BATCH -)
                        current_batch = None
                continue
            elif line.startswith('###') or (line.upper().startswith('BATCH')):
                # Extract batch number from sub-header like "### Batch 1" or "BATCH - 1"
                match = re.search(r'Batch\s*[-]?\s*(\d+)', line, re.IGNORECASE)
                if match:
                    current_batch = int(match.group(1))
                # For sections like "PPT Students", "Community", etc., keep current batch
                # (don't reset it, just continue with the current batch)
                continue
            
            # Parse student line - support multiple formats
            # New format: Classroom: X, Batch: Y, First Name: A, Last Name: B, Email: C, Job: D, Salary: E, Before Bloom: F
            if line.startswith('Classroom:'):
                classroom_match = re.search(r'Classroom:\s*([^,]+?)(?:,\s*Batch:|$)', line)
                batch_match = re.search(r'Batch:\s*([^,]+?)(?:,\s*First Name:|$)', line)
                first_name_match = re.search(r'First Name:\s*([^,]+?)(?:,\s*Last Name:|$)', line)
                last_name_match = re.search(r'Last Name:\s*([^,]+?)(?:,\s*Email:|$)', line)
                email_match = re.search(r'Email:\s*([^,]+?)(?:,\s*Job:|$)', line)
                job_match = re.search(r'Job:\s*([^,]+?)(?:,\s*Salary:|$)', line)
                salary_match = re.search(r'Salary:\s*([^,]+?)(?:,\s*Before Bloom:|$)', line)
                before_match = re.search(r'Before Bloom:\s*(.+?)$', line)
                
                if classroom_match and first_name_match:
                    classroom_name = classroom_match.group(1).strip()
                    batch_str = batch_match.group(1).strip() if batch_match else 'N/A'
                    first_name = first_name_match.group(1).strip()
                    last_name_raw = last_name_match.group(1).strip() if last_name_match else ''
                    # Treat "N/A" as empty string for last name
                    if last_name_raw.upper() == 'N/A' or last_name_raw == '':
                        last_name = ''
                    else:
                        last_name = last_name_raw
                    student_email = email_match.group(1).strip() if email_match else 'N/A'
                    job_status = job_match.group(1).strip() if job_match else 'N/A'
                    salary_str = salary_match.group(1).strip() if salary_match else 'N/A'
                    before_bloom = before_match.group(1).strip() if before_match else 'N/A'
                    
                    # Parse batch number
                    batch_number = None
                    if batch_str and batch_str.upper() != 'N/A':
                        batch_num_match = re.search(r'(\d+)', batch_str)
                        if batch_num_match:
                            try:
                                batch_number = int(batch_num_match.group(1))
                            except ValueError:
                                pass
                    
                    # Parse salary - handle "N/A", "per day 1500", or numeric values
                    salary = None
                    if salary_str and salary_str.upper() != 'N/A':
                        salary_match_num = re.search(r'(\d+)', salary_str)
                        if salary_match_num:
                            try:
                                salary = float(salary_match_num.group(1))
                            except ValueError:
                                salary = None
                    
                    # Combine first and last name
                    student_name = f"{first_name} {last_name}".strip()
                    
                    student_data = {
                        'classroom': classroom_name,
                        'batch': batch_number,
                        'name': student_name,
                        'first_name': first_name,
                        'last_name': last_name,
                        'email': student_email,
                        'job_status': job_status,
                        'salary': salary,
                        'before_bloom': before_bloom,
                    }
                    students.append(student_data)
                    continue
            
            # Old format: Student Name: <name>, Email: <email>, Job Status: <status>
            elif line.startswith('Student Name:') or line.startswith('Student:'):
                student_name = None
                student_email = 'N/A'
                job_status = 'N/A'
                salary = None
                before_bloom = None
                
                # Format: Student: <name>, Job: <job>, Salary: <salary>, Before Bloom: <before_bloom>
                if line.startswith('Student:'):
                    name_match = re.search(r'Student:\s*(.+?)(?:,\s*Job:|$)', line)
                    job_match = re.search(r'Job:\s*([^,]+?)(?:,\s*Salary:|$)', line)
                    salary_match = re.search(r'Salary:\s*([^,]+?)(?:,\s*Before Bloom:|$)', line)
                    before_match = re.search(r'Before Bloom:\s*(.+?)$', line)
                    
                    if name_match:
                        student_name = name_match.group(1).strip()
                        job_status = job_match.group(1).strip() if job_match else 'N/A'
                        salary_str = salary_match.group(1).strip() if salary_match else 'N/A'
                        before_bloom = before_match.group(1).strip() if before_match else 'N/A'
                        
                        # Parse salary - handle "N/A", "per day 1500", or numeric values
                        if salary_str and salary_str.upper() != 'N/A':
                            # Extract numeric value from salary string
                            salary_match_num = re.search(r'(\d+)', salary_str)
                            if salary_match_num:
                                try:
                                    salary = float(salary_match_num.group(1))
                                except ValueError:
                                    salary = None
                
                # Format: Student Name: <name>, Email: <email>, Job Status: <status>
                elif line.startswith('Student Name:'):
                    name_match = re.search(r'Student Name:\s*(.+?)(?:,\s*Email:|$)', line)
                    email_match = re.search(r'Email:\s*([^,]+?)(?:,\s*Job Status:|$)', line)
                    job_match = re.search(r'Job Status:\s*(.+?)$', line)
                    
                    if name_match:
                        student_name = name_match.group(1).strip()
                        student_email = email_match.group(1).strip() if email_match else 'N/A'
                        job_status = job_match.group(1).strip() if job_match else 'N/A'
                
                if student_name and current_classroom:  # Only add if we have a classroom
                    student_data = {
                        'classroom': current_classroom,
                        'batch': current_batch,
                        'name': student_name,
                        'email': student_email,
                        'job_status': job_status,
                        'salary': salary,
                        'before_bloom': before_bloom,
                    }
                    students.append(student_data)
                elif student_name and not current_classroom:
                    # Log warning for students without classroom context
                    self.stdout.write(self.style.WARNING(
                        f'Skipping student "{student_name}" - no classroom context'
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

