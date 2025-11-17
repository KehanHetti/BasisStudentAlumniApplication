"""
Management command to clean up empty classrooms (classrooms with no students).
"""
from django.core.management.base import BaseCommand
from students.models import Classroom


class Command(BaseCommand):
    help = 'Delete classrooms that have no students assigned'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        all_classrooms = Classroom.objects.all().order_by('name', 'batch_number')
        classrooms_without_students = [
            c for c in all_classrooms if c.students.count() == 0
        ]
        
        self.stdout.write(f'Total classrooms: {all_classrooms.count()}')
        self.stdout.write(f'Classrooms without students: {len(classrooms_without_students)}')
        
        if classrooms_without_students:
            self.stdout.write('\nClassrooms to be deleted:')
            for c in classrooms_without_students:
                batch_str = f'Batch {c.batch_number}' if c.batch_number else 'No Batch'
                self.stdout.write(f'  - {c.name} - {batch_str}')
            
            if not dry_run:
                deleted_count = 0
                for c in classrooms_without_students:
                    c.delete()
                    deleted_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'\nDeleted {deleted_count} empty classrooms'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    '\n[DRY RUN] No classrooms were deleted. Run without --dry-run to delete.'
                ))
        else:
            self.stdout.write(self.style.SUCCESS('\nNo empty classrooms to delete'))
        
        # Show remaining classrooms
        remaining = Classroom.objects.all().order_by('name', 'batch_number')
        self.stdout.write(f'\nRemaining classrooms ({remaining.count()}):')
        for c in remaining:
            student_count = c.students.count()
            batch_str = f'Batch {c.batch_number}' if c.batch_number else 'No Batch'
            self.stdout.write(f'  {c.name} - {batch_str}: {student_count} students')

