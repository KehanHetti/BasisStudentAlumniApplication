from django.contrib import admin
from .models import Report, ReportTemplate


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'generated_by', 'generated_at', 'is_public']
    list_filter = ['report_type', 'is_public', 'generated_at']
    search_fields = ['name', 'description']
    ordering = ['-generated_at']
    readonly_fields = ['generated_at']


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'created_at']
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
