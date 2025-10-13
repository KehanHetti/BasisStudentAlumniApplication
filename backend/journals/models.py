from django.db import models
from django.utils import timezone


class JournalEntry(models.Model):
    ENTRY_TYPE_CHOICES = [
        ('progress', 'Progress Update'),
        ('achievement', 'Achievement'),
        ('concern', 'Concern'),
        ('general', 'General Note'),
        ('goal', 'Goal Setting'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='journal_entries')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='journal_entries', blank=True, null=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_private = models.BooleanField(default=False)
    created_by = models.CharField(max_length=100, blank=True, null=True)  # Trainer/instructor name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.title}"


class JournalGoal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    target_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.title}"
