"""
Management command to check if spreadsheets have been imported properly.
"""
from django.core.management.base import BaseCommand
from students.models import Student, Classroom, AlumniJob
import os


class Command(BaseCommand):
    help = 'Check if spreadsheets have been imported properly and verify job information'

    def handle(self, *args, **options):
        print("=" * 80)
        print("IMPORT VERIFICATION REPORT")
        print("=" * 80)

        # Check spreadsheets in data folder
        data_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
        if os.path.exists(data_folder):
            spreadsheets = [f for f in os.listdir(data_folder) if f.endswith(('.xlsx', '.csv'))]
            print(f"\nSpreadsheets found in data folder: {len(spreadsheets)}")
            for sheet in spreadsheets:
                print(f"   - {sheet}")
        else:
            print(f"\nData folder not found at: {data_folder}")

        # Check Classrooms
        print("\n" + "=" * 80)
        print("CLASSROOMS")
        print("=" * 80)
        classrooms = Classroom.objects.all()
        print(f"Total Classrooms: {classrooms.count()}")
        for classroom in classrooms:
            student_count = classroom.students.count()
            alumni_count = classroom.students.filter(status='alumni').count()
            print(f"\n  {classroom.name} (Batch {classroom.batch_number or 'N/A'})")
            print(f"    - Total Students: {student_count}")
            print(f"    - Alumni: {alumni_count}")
            print(f"    - Active: {student_count - alumni_count}")

        # Check Students
        print("\n" + "=" * 80)
        print("STUDENTS SUMMARY")
        print("=" * 80)
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='active').count()
        alumni_students = Student.objects.filter(status='alumni').count()
        with_classroom = Student.objects.exclude(classroom=None).count()
        without_classroom = Student.objects.filter(classroom=None).count()

        print(f"Total Students: {total_students}")
        print(f"  - Active: {active_students}")
        print(f"  - Alumni: {alumni_students}")
        print(f"  - With Classroom: {with_classroom}")
        print(f"  - Without Classroom: {without_classroom}")

        # Check Alumni Jobs
        print("\n" + "=" * 80)
        print("ALUMNI JOB TRACKING")
        print("=" * 80)
        total_alumni_jobs = AlumniJob.objects.count()
        alumni_with_job_title = AlumniJob.objects.exclude(job_title__isnull=True).exclude(job_title='').count()
        alumni_without_job_title = AlumniJob.objects.filter(job_title__isnull=True).count() + AlumniJob.objects.filter(job_title='').count()
        alumni_with_salary = AlumniJob.objects.exclude(salary__isnull=True).count()
        alumni_employed = AlumniJob.objects.filter(employment_status='employed').count()
        alumni_continuing_studies = AlumniJob.objects.filter(employment_status='continuing_studies').count()
        alumni_looking = AlumniJob.objects.filter(employment_status='looking').count()
        alumni_not_working = AlumniJob.objects.filter(employment_status='not_working').count()

        print(f"Total Alumni Job Records: {total_alumni_jobs}")
        print(f"  - With Job Title: {alumni_with_job_title}")
        print(f"  - Without Job Title: {alumni_without_job_title}")
        print(f"  - With Salary: {alumni_with_salary}")
        print(f"\nEmployment Status Breakdown:")
        print(f"  - Employed: {alumni_employed}")
        print(f"  - Continuing Studies: {alumni_continuing_studies}")
        print(f"  - Looking for Job: {alumni_looking}")
        print(f"  - Not Working: {alumni_not_working}")

        # Check for alumni without job records
        alumni_without_job_record = Student.objects.filter(status='alumni').exclude(id__in=AlumniJob.objects.values_list('student_id', flat=True))
        print(f"\nWARNING: Alumni without Job Records: {alumni_without_job_record.count()}")
        if alumni_without_job_record.exists():
            print("   Students:")
            for student in alumni_without_job_record[:10]:
                print(f"     - {student.full_name} ({student.email})")
            if alumni_without_job_record.count() > 10:
                print(f"     ... and {alumni_without_job_record.count() - 10} more")

        # Sample of alumni jobs
        print("\n" + "=" * 80)
        print("SAMPLE ALUMNI JOBS (First 15)")
        print("=" * 80)
        alumni_jobs = AlumniJob.objects.select_related('student', 'student__classroom').all()[:15]
        for aj in alumni_jobs:
            classroom_name = aj.student.classroom.name if aj.student.classroom else "No Classroom"
            job_info = aj.job_title if aj.job_title else aj.get_employment_status_display() or "No Status"
            salary_info = f" - Rs {aj.salary:,.0f}" if aj.salary else ""
            print(f"  {aj.student.full_name} ({classroom_name})")
            print(f"    Job: {job_info}{salary_info}")
            if aj.job_before_bloom:
                print(f"    Before Bloom: {aj.job_before_bloom}")

        # Check by classroom
        print("\n" + "=" * 80)
        print("ALUMNI JOBS BY CLASSROOM")
        print("=" * 80)
        for classroom in classrooms:
            classroom_alumni = classroom.students.filter(status='alumni')
            classroom_jobs = AlumniJob.objects.filter(student__classroom=classroom)
            print(f"\n{classroom.name}:")
            print(f"  - Alumni Students: {classroom_alumni.count()}")
            print(f"  - Job Records: {classroom_jobs.count()}")
            print(f"  - With Job Title: {classroom_jobs.exclude(job_title__isnull=True).exclude(job_title='').count()}")
            print(f"  - With Salary: {classroom_jobs.exclude(salary__isnull=True).count()}")

        print("\n" + "=" * 80)
        print("VERIFICATION COMPLETE")
        print("=" * 80)

