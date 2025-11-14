from django.core.management.base import BaseCommand
from django.utils import timezone
from students.models import Student
from courses.models import Course, Enrollment
from attendance.models import Attendance, AttendanceSession
from journals.models import JournalEntry, JournalGoal
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Populate the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create sample students with diverse names
        students_data = [
            {'first_name': 'Emma', 'last_name': 'Thompson', 'email': 'emma.thompson@example.com', 'status': 'active'},
            {'first_name': 'Michael', 'last_name': 'Chen', 'email': 'michael.chen@example.com', 'status': 'active'},
            {'first_name': 'Sarah', 'last_name': 'Rodriguez', 'email': 'sarah.rodriguez@example.com', 'status': 'active'},
            {'first_name': 'James', 'last_name': 'Williams', 'email': 'james.williams@example.com', 'status': 'active'},
            {'first_name': 'Olivia', 'last_name': 'Brown', 'email': 'olivia.brown@example.com', 'status': 'active'},
            {'first_name': 'David', 'last_name': 'Martinez', 'email': 'david.martinez@example.com', 'status': 'alumni'},
            {'first_name': 'Sophia', 'last_name': 'Anderson', 'email': 'sophia.anderson@example.com', 'status': 'active'},
            {'first_name': 'Daniel', 'last_name': 'Taylor', 'email': 'daniel.taylor@example.com', 'status': 'active'},
            {'first_name': 'Isabella', 'last_name': 'Wilson', 'email': 'isabella.wilson@example.com', 'status': 'active'},
            {'first_name': 'Christopher', 'last_name': 'Garcia', 'email': 'christopher.garcia@example.com', 'status': 'alumni'},
            {'first_name': 'Mia', 'last_name': 'Jackson', 'email': 'mia.jackson@example.com', 'status': 'active'},
            {'first_name': 'Matthew', 'last_name': 'Lee', 'email': 'matthew.lee@example.com', 'status': 'active'},
        ]
        
        students = []
        for data in students_data:
            student, created = Student.objects.get_or_create(
                email=data['email'],
                defaults=data
            )
            students.append(student)
            if created:
                self.stdout.write(f'Created student: {student.full_name}')
        
        # Create sample courses - all separate classes from the provided list
        courses_data = [
            {'name': 'Digital Literacy eLearning Pathway', 'level': 'beginner', 'duration_weeks': 8, 'description': 'Comprehensive digital literacy training program'},
            {'name': 'Touch Typing', 'level': 'beginner', 'duration_weeks': 6, 'description': 'Learn to type efficiently and accurately'},
            {'name': 'MS Office 365', 'level': 'beginner', 'duration_weeks': 4, 'description': 'Introduction to Microsoft Office 365 suite'},
            {'name': 'MS Word Basic', 'level': 'beginner', 'duration_weeks': 3, 'description': 'Microsoft Word fundamentals and essential skills'},
            {'name': 'MS Word Intermediate', 'level': 'intermediate', 'duration_weeks': 4, 'description': 'Microsoft Word formatting and document features'},
            {'name': 'MS Word Advanced', 'level': 'advanced', 'duration_weeks': 4, 'description': 'Microsoft Word document creation and automation'},
            {'name': 'MS Excel Basic', 'level': 'beginner', 'duration_weeks': 3, 'description': 'Microsoft Excel spreadsheet essentials'},
            {'name': 'MS Excel Intermediate', 'level': 'intermediate', 'duration_weeks': 4, 'description': 'Microsoft Excel formulas and functions'},
            {'name': 'MS Excel Advanced', 'level': 'advanced', 'duration_weeks': 4, 'description': 'Microsoft Excel data analysis and visualization'},
            {'name': 'MS PowerPoint', 'level': 'beginner', 'duration_weeks': 3, 'description': 'Create professional presentations with Microsoft PowerPoint'},
        ]
        
        courses = []
        for data in courses_data:
            course, created = Course.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            courses.append(course)
            if created:
                self.stdout.write(f'Created course: {course.name}')
        
        # Create sample enrollments - ensure all students are enrolled in at least one course
        for student in students:
            # Assign each student to 2-4 random courses
            num_courses = random.randint(2, 4)
            selected_courses = random.sample(courses, min(num_courses, len(courses)))
            
            for course in selected_courses:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={
                        'enrollment_date': timezone.now() - timedelta(days=random.randint(1, 90)),
                        'is_completed': random.choice([True, False]),
                        'grade': random.choice(['A', 'B', 'C', 'D']) if random.choice([True, False]) else None,
                    }
                )
                if created:
                    self.stdout.write(f'Enrolled: {student.full_name} in {course.name}')
        
        # Create sample attendance records
        for course in courses:
            for i in range(30):  # Last 30 days
                date = timezone.now().date() - timedelta(days=i)
                session, created = AttendanceSession.objects.get_or_create(
                    course=course,
                    date=date,
                    defaults={
                        'start_time': '09:00',
                        'end_time': '17:00',
                    }
                )
                
                if created:
                    # Create attendance records for enrolled students
                    for enrollment in course.enrollments.all():
                        status = random.choices(
                            ['present', 'absent', 'late', 'excused'],
                            weights=[70, 15, 10, 5]
                        )[0]
                        
                        Attendance.objects.get_or_create(
                            student=enrollment.student,
                            course=course,
                            date=date,
                            defaults={'status': status}
                        )
        
        # Create sample journal entries
        entry_types = ['progress', 'achievement', 'concern', 'general', 'goal']
        priorities = ['low', 'medium', 'high', 'urgent']
        
        for student in students:
            for i in range(random.randint(5, 15)):
                entry = JournalEntry.objects.create(
                    student=student,
                    course=random.choice(courses) if random.choice([True, False]) else None,
                    entry_type=random.choice(entry_types),
                    title=f'Sample Entry {i+1}',
                    content=f'This is a sample journal entry for {student.full_name}.',
                    priority=random.choice(priorities),
                    created_by='System',
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
        
        # Create sample goals
        goal_statuses = ['pending', 'in_progress', 'completed']
        
        for student in students:
            for i in range(random.randint(2, 5)):
                JournalGoal.objects.create(
                    student=student,
                    title=f'Goal {i+1} for {student.first_name}',
                    description=f'This is a sample goal for {student.full_name}.',
                    target_date=timezone.now().date() + timedelta(days=random.randint(30, 90)),
                    status=random.choice(goal_statuses)
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
