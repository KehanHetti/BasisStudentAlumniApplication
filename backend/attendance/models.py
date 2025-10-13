from django.db import models
from django.utils import timezone


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'course', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.course.name} - {self.date}"


class AttendanceSession(models.Model):
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='attendance_sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['course', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.course.name} - {self.date}"
