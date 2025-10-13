from django.contrib import admin
from .models import Course, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'status', 'max_students', 'start_date']
    list_filter = ['level', 'status', 'start_date']
    search_fields = ['name', 'description']
    ordering = ['-created_at']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrollment_date', 'is_completed', 'grade']
    list_filter = ['is_completed', 'enrollment_date', 'course']
    search_fields = ['student__first_name', 'student__last_name', 'course__name']
    ordering = ['-enrollment_date']
