from django.contrib import admin
from .models import JournalEntry, JournalGoal


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'entry_type', 'priority', 'created_at']
    list_filter = ['entry_type', 'priority', 'is_private', 'created_at']
    search_fields = ['student__first_name', 'student__last_name', 'title']
    ordering = ['-created_at']


@admin.register(JournalGoal)
class JournalGoalAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'status', 'target_date', 'created_at']
    list_filter = ['status', 'target_date', 'created_at']
    search_fields = ['student__first_name', 'student__last_name', 'title']
    ordering = ['-created_at']
