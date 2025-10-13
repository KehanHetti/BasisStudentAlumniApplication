from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'status', 'enrollment_date']
    list_filter = ['status', 'gender', 'enrollment_date']
    search_fields = ['first_name', 'last_name', 'email']
    ordering = ['-enrollment_date']
    readonly_fields = ['created_at', 'updated_at']
