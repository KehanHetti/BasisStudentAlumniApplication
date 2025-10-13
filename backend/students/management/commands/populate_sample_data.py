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
        
        # Create sample students
        students_data = [
            {'first_name': 'Aarav', 'last_name': 'Sharma', 'email': 'aarav.sharma@example.com', 'status': 'active'},
            {'first_name': 'Priya', 'last_name': 'Patel', 'email': 'priya.patel@example.com', 'status': 'active'},
            {'first_name': 'Rohan', 'last_name': 'Singh', 'email': 'rohan.singh@example.com', 'status': 'graduated'},
            {'first_name': 'Saanvi', 'last_name': 'Gupta', 'email': 'saanvi.gupta@example.com', 'status': 'active'},
            {'first_name': 'Arjun', 'last_name': 'Kumar', 'email': 'arjun.kumar@example.com', 'status': 'active'},
            {'first_name': 'Meera', 'last_name': 'Joshi', 'email': 'meera.joshi@example.com', 'status': 'graduated'},
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
        
        # Create sample courses
        courses_data = [
            {'name': 'Digital Literacy Basics', 'level': 'beginner', 'duration_weeks': 4},
            {'name': 'Typing Club', 'level': 'beginner', 'duration_weeks': 6},
            {'name': 'Computer Fundamentals', 'level': 'beginner', 'duration_weeks': 8},
            {'name': 'Advanced Excel', 'level': 'intermediate', 'duration_weeks': 6},
            {'name': 'Web Development', 'level': 'advanced', 'duration_weeks': 12},
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
        
        # Create sample enrollments
        for student in students:
            for course in random.sample(courses, random.randint(1, 3)):
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
                    self.stdout.write(f'Created enrollment: {student.full_name} in {course.name}')
        
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
