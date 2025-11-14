"""
Management command to sync classrooms to courses.
This ensures that courses match the classroom names.
"""
from django.core.management.base import BaseCommand
from students.models import Classroom
from courses.models import Course


class Command(BaseCommand):
    help = 'Sync classrooms to courses - creates courses based on classroom names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-existing',
            action='store_true',
            help='Delete existing courses that are not based on classrooms',
        )

    def handle(self, *args, **options):
        delete_existing = options.get('delete_existing', False)
        
        self.stdout.write('Syncing classrooms to courses...')
        
        # Get all classrooms
        classrooms = Classroom.objects.all()
        self.stdout.write(f'Found {classrooms.count()} classrooms')
        
        # Create or update courses based on classrooms
        created_count = 0
        updated_count = 0
        
        for classroom in classrooms:
            # Create course name with batch if applicable
            if classroom.batch_number:
                course_name = f"{classroom.name} - Batch {classroom.batch_number}"
            else:
                course_name = classroom.name
            
            # Get or create course
            course, created = Course.objects.get_or_create(
                name=course_name,
                defaults={
                    'description': f"Course for {classroom.name} classroom" + (f" (Batch {classroom.batch_number})" if classroom.batch_number else ""),
                    'status': 'active' if classroom.is_active else 'inactive',
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created course: {course_name}'))
            else:
                # Update existing course
                course.description = f"Course for {classroom.name} classroom" + (f" (Batch {classroom.batch_number})" if classroom.batch_number else "")
                course.status = 'active' if classroom.is_active else 'inactive'
                course.save()
                updated_count += 1
                self.stdout.write(f'Updated course: {course_name}')
        
        # Delete existing courses that don't match classrooms if requested
        if delete_existing:
            classroom_course_names = set()
            for classroom in classrooms:
                if classroom.batch_number:
                    classroom_course_names.add(f"{classroom.name} - Batch {classroom.batch_number}")
                else:
                    classroom_course_names.add(classroom.name)
            
            # Also add just the classroom names without batch
            for classroom in classrooms:
                classroom_course_names.add(classroom.name)
            
            courses_to_delete = Course.objects.exclude(name__in=classroom_course_names)
            deleted_count = courses_to_delete.count()
            
            if deleted_count > 0:
                self.stdout.write(f'\nDeleting {deleted_count} courses that do not match classrooms:')
                for course in courses_to_delete:
                    self.stdout.write(f'  - {course.name}')
                courses_to_delete.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} courses'))
            else:
                self.stdout.write('\nNo courses to delete - all courses match classrooms')
        
        self.stdout.write(self.style.SUCCESS(
            f'\nSync complete: {created_count} created, {updated_count} updated'
        ))

