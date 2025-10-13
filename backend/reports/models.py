from django.db import models
from django.utils import timezone


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('attendance', 'Attendance Report'),
        ('progress', 'Progress Report'),
        ('enrollment', 'Enrollment Report'),
        ('completion', 'Completion Report'),
        ('custom', 'Custom Report'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    parameters = models.JSONField(default=dict, blank=True)
    generated_by = models.CharField(max_length=100, blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    file_path = models.CharField(max_length=500, blank=True, null=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return self.name


class ReportTemplate(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    template_type = models.CharField(max_length=20, choices=Report.REPORT_TYPE_CHOICES)
    template_data = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
