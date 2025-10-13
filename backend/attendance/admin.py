from django.contrib import admin
from .models import Attendance, AttendanceSession


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'date', 'status']
    list_filter = ['status', 'date', 'course']
    search_fields = ['student__first_name', 'student__last_name', 'course__name']
    ordering = ['-date']


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'date', 'start_time', 'end_time']
    list_filter = ['date', 'course']
    search_fields = ['course__name']
    ordering = ['-date']
