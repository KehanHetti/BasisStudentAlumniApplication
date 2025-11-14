"""
Management command to verify student data import, classrooms, and batches in detail.
"""
from django.core.management.base import BaseCommand
from students.models import Student, Classroom, AlumniJob
from collections import defaultdict


class Command(BaseCommand):
    help = 'Verify student data import, classrooms, and batches in detail'

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("DETAILED IMPORT VERIFICATION REPORT"))
        self.stdout.write("=" * 80)
        
        # 1. Check Classrooms and Batches
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("CLASSROOMS & BATCHES DETAIL"))
        self.stdout.write("=" * 80)
        
        classrooms = Classroom.objects.all().order_by('name', 'batch_number')
        classroom_stats = defaultdict(lambda: {'batches': [], 'total_students': 0, 'active': 0, 'alumni': 0})
        
        for classroom in classrooms:
            student_count = classroom.students.count()
            active_count = classroom.students.filter(status='active').count()
            alumni_count = classroom.students.filter(status='alumni').count()
            
            classroom_stats[classroom.name]['batches'].append({
                'batch': classroom.batch_number,
                'id': classroom.id,
                'students': student_count,
                'active': active_count,
                'alumni': alumni_count
            })
            classroom_stats[classroom.name]['total_students'] += student_count
            classroom_stats[classroom.name]['active'] += active_count
            classroom_stats[classroom.name]['alumni'] += alumni_count
        
        for classroom_name, stats in sorted(classroom_stats.items()):
            self.stdout.write(f"\n{classroom_name}:")
            self.stdout.write(f"  Total Students: {stats['total_students']} (Active: {stats['active']}, Alumni: {stats['alumni']})")
            self.stdout.write(f"  Batches: {len(stats['batches'])}")
            for batch_info in sorted(stats['batches'], key=lambda x: x['batch'] or 0):
                batch_str = f"Batch {batch_info['batch']}" if batch_info['batch'] else "No Batch"
                self.stdout.write(f"    - {batch_str}: {batch_info['students']} students (ID: {batch_info['id']})")
        
        # 2. Check Students without Classrooms
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.WARNING("STUDENTS WITHOUT CLASSROOMS"))
        self.stdout.write("=" * 80)
        
        students_without_classroom = Student.objects.filter(classroom=None)
        count = students_without_classroom.count()
        self.stdout.write(f"Total: {count}")
        
        if count > 0:
            self.stdout.write("\nFirst 20 students without classrooms:")
            for student in students_without_classroom[:20]:
                status_info = f" ({student.status})" if student.status != 'active' else ""
                self.stdout.write(f"  - {student.full_name} - {student.email}{status_info}")
            if count > 20:
                self.stdout.write(f"  ... and {count - 20} more")
        
        # 3. Check for duplicate classrooms (same name, different batch numbers)
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("CLASSROOM UNIQUENESS CHECK"))
        self.stdout.write("=" * 80)
        
        classroom_names = defaultdict(list)
        for classroom in classrooms:
            classroom_names[classroom.name].append(classroom)
        
        duplicates_found = False
        for name, classroom_list in classroom_names.items():
            if len(classroom_list) > 1:
                # Check if they have different batch numbers
                batch_numbers = [c.batch_number for c in classroom_list]
                if len(set(batch_numbers)) != len(batch_numbers):
                    duplicates_found = True
                    self.stdout.write(self.style.WARNING(f"\nPotential duplicate: {name}"))
                    for c in classroom_list:
                        self.stdout.write(f"  - ID {c.id}: Batch {c.batch_number}, Students: {c.students.count()}")
        
        if not duplicates_found:
            self.stdout.write("[OK] All classrooms have unique name+batch combinations")
        
        # 4. Check for students with invalid classroom references
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("DATA INTEGRITY CHECK"))
        self.stdout.write("=" * 80)
        
        all_students = Student.objects.all()
        invalid_classrooms = 0
        for student in all_students:
            if student.classroom_id and not Classroom.objects.filter(id=student.classroom_id).exists():
                invalid_classrooms += 1
                self.stdout.write(self.style.ERROR(f"  Student {student.full_name} has invalid classroom_id: {student.classroom_id}"))
        
        if invalid_classrooms == 0:
            self.stdout.write("[OK] All student classroom references are valid")
        
        # 5. Summary Statistics
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("SUMMARY STATISTICS"))
        self.stdout.write("=" * 80)
        
        total_classrooms = Classroom.objects.count()
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='active').count()
        alumni_students = Student.objects.filter(status='alumni').count()
        students_with_classroom = Student.objects.exclude(classroom=None).count()
        
        self.stdout.write(f"\nClassrooms: {total_classrooms}")
        self.stdout.write(f"Students: {total_students}")
        self.stdout.write(f"  - Active: {active_students}")
        self.stdout.write(f"  - Alumni: {alumni_students}")
        self.stdout.write(f"  - With Classroom: {students_with_classroom} ({students_with_classroom/total_students*100:.1f}%)")
        self.stdout.write(f"  - Without Classroom: {count} ({count/total_students*100:.1f}%)")
        
        # 6. Check batch number distribution
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("BATCH NUMBER DISTRIBUTION"))
        self.stdout.write("=" * 80)
        
        batch_distribution = defaultdict(int)
        for classroom in classrooms:
            batch_key = f"{classroom.name} - Batch {classroom.batch_number}" if classroom.batch_number else f"{classroom.name} - No Batch"
            batch_distribution[batch_key] = classroom.students.count()
        
        for batch_key, student_count in sorted(batch_distribution.items()):
            self.stdout.write(f"  {batch_key}: {student_count} students")
        
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("VERIFICATION COMPLETE"))
        self.stdout.write("=" * 80)

