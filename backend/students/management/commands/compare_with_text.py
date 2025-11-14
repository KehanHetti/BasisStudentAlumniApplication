"""
Management command to compare database data with expected text file format.
"""
from django.core.management.base import BaseCommand
from students.models import Student, Classroom, AlumniJob
from collections import defaultdict
import re


class Command(BaseCommand):
    help = 'Compare database data with expected text file format'

    def add_arguments(self, parser):
        parser.add_argument('text_file', type=str, help='Path to the text file to compare against')

    def handle(self, *args, **options):
        text_file = options['text_file']
        
        try:
            with open(text_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {text_file}'))
            return
        
        # Parse expected data from text file
        expected_data = self._parse_expected_data(content)
        
        # Get actual data from database
        actual_data = self._get_actual_data()
        
        # Compare
        self._compare_data(expected_data, actual_data)
    
    def _parse_expected_data(self, content):
        """Parse expected data from text file"""
        expected = defaultdict(lambda: defaultdict(list))
        current_classroom = None
        current_batch = None
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('---'):
                continue
            
            # Parse headers
            if line.startswith('##') and not line.startswith('###'):
                line_content = line[2:].strip()
                classroom_match = re.match(r'(.+?)\s+(\d+)$', line_content)
                if classroom_match:
                    current_classroom = classroom_match.group(1).strip()
                    current_batch = int(classroom_match.group(2))
                else:
                    match = re.match(r'(.+?)(?:\s*\(.*?\))?$', line_content)
                    if match:
                        current_classroom = match.group(1).strip()
                        current_batch = None
            elif line.startswith('###'):
                match = re.search(r'Batch\s+(\d+)', line, re.IGNORECASE)
                if match:
                    current_batch = int(match.group(1))
            
            # Parse student lines
            if line.startswith('Student Name:') and current_classroom:
                name_match = re.search(r'Student Name:\s*(.+?)(?:,\s*Email:|$)', line)
                email_match = re.search(r'Email:\s*([^,]+?)(?:,\s*Job Status:|$)', line)
                
                if name_match:
                    name = name_match.group(1).strip()
                    email = email_match.group(1).strip() if email_match else None
                    
                    # Generate expected email if not provided
                    if not email or email == 'N/A':
                        name_parts = name.split(',', 1)
                        first_name = name_parts[0].strip()
                        last_name = name_parts[1].strip() if len(name_parts) > 1 else ''
                        email_base = f"{first_name.lower()}{last_name.lower() if last_name else ''}".replace(' ', '').replace('.', '').replace(',', '')
                        email = f"{email_base}@basislearning.net"
                    
                    key = f"{current_classroom}_{current_batch}" if current_batch else current_classroom
                    expected[key].append({
                        'name': name,
                        'email': email.lower(),
                        'classroom': current_classroom,
                        'batch': current_batch
                    })
        
        return expected
    
    def _get_actual_data(self):
        """Get actual data from database"""
        actual = defaultdict(lambda: defaultdict(list))
        
        for classroom in Classroom.objects.all():
            key = f"{classroom.name}_{classroom.batch_number}" if classroom.batch_number else classroom.name
            for student in classroom.students.all():
                actual[key].append({
                    'name': student.full_name,
                    'email': student.email.lower(),
                    'classroom': classroom.name,
                    'batch': classroom.batch_number
                })
        
        return actual
    
    def _compare_data(self, expected, actual):
        """Compare expected vs actual data"""
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("COMPARISON REPORT"))
        self.stdout.write("=" * 80)
        
        # Check each expected classroom/batch
        total_expected = 0
        total_found = 0
        missing_students = []
        
        for key, expected_students in expected.items():
            classroom_name = expected_students[0]['classroom'] if expected_students else 'Unknown'
            batch = expected_students[0]['batch'] if expected_students else None
            batch_str = f"Batch {batch}" if batch else "No Batch"
            
            self.stdout.write(f"\n{classroom_name} - {batch_str}:")
            self.stdout.write(f"  Expected: {len(expected_students)} students")
            
            actual_students = actual.get(key, [])
            self.stdout.write(f"  Found in DB: {len(actual_students)} students")
            
            total_expected += len(expected_students)
            
            # Check each expected student
            for exp_student in expected_students:
                found = False
                for act_student in actual_students:
                    if act_student['email'] == exp_student['email']:
                        found = True
                        total_found += 1
                        break
                
                if not found:
                    missing_students.append({
                        'name': exp_student['name'],
                        'email': exp_student['email'],
                        'classroom': classroom_name,
                        'batch': batch
                    })
            
            if len(expected_students) != len(actual_students):
                self.stdout.write(self.style.WARNING(
                    f"  MISMATCH: Expected {len(expected_students)}, found {len(actual_students)}"
                ))
            else:
                self.stdout.write(self.style.SUCCESS("  ✓ Count matches"))
        
        # Summary
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("SUMMARY"))
        self.stdout.write("=" * 80)
        self.stdout.write(f"Total expected students: {total_expected}")
        self.stdout.write(f"Total found in database: {total_found}")
        self.stdout.write(f"Missing students: {len(missing_students)}")
        
        if missing_students:
            self.stdout.write("\n" + self.style.WARNING("MISSING STUDENTS:"))
            for student in missing_students[:20]:
                batch_info = f"Batch {student['batch']}" if student['batch'] else "No Batch"
                self.stdout.write(f"  - {student['name']} ({student['email']}) - {student['classroom']} {batch_info}")
            if len(missing_students) > 20:
                self.stdout.write(f"  ... and {len(missing_students) - 20} more")
        
        # Check for students in DB but not in expected
        extra_students = []
        for key, actual_students in actual.items():
            expected_students = expected.get(key, [])
            for act_student in actual_students:
                found = False
                for exp_student in expected_students:
                    if act_student['email'] == exp_student['email']:
                        found = True
                        break
                if not found:
                    extra_students.append(act_student)
        
        if extra_students:
            self.stdout.write(f"\nStudents in DB but not in text file: {len(extra_students)}")
            for student in extra_students[:10]:
                self.stdout.write(f"  - {student['name']} ({student['email']})")
            if len(extra_students) > 10:
                self.stdout.write(f"  ... and {len(extra_students) - 10} more")

