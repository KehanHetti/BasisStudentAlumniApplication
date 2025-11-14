from django.contrib import admin
from .models import Student, Classroom, AlumniJob


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ['name', 'batch_number', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name', '-batch_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'classroom', 'status', 'enrollment_date']
    list_filter = ['status', 'gender', 'classroom', 'enrollment_date']
    search_fields = ['first_name', 'last_name', 'email']
    ordering = ['-enrollment_date']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['classroom']


@admin.register(AlumniJob)
class AlumniJobAdmin(admin.ModelAdmin):
    list_display = ['student', 'job_title', 'employer', 'salary', 'employment_status', 'created_at']
    list_filter = ['employment_status', 'created_at']
    search_fields = ['student__first_name', 'student__last_name', 'job_title', 'employer']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['student']
