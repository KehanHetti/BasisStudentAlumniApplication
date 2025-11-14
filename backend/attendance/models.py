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
    classroom = models.ForeignKey('students.Classroom', on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['student', 'classroom', 'date'], ['student', 'course', 'date']]
        ordering = ['-date']
    
    def __str__(self):
        if self.classroom:
            return f"{self.student.full_name} - {self.classroom.name} - {self.date}"
        return f"{self.student.full_name} - {self.course.name if self.course else 'N/A'} - {self.date}"


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
