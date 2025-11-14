from django.db import models
from django.core.validators import EmailValidator
from django.utils import timezone


class Classroom(models.Model):
    """Represents a classroom/batch (e.g., Freesia Bloom, Bluebells Bloom, Daisy)"""
    
    name = models.CharField(max_length=100, help_text="Classroom name (e.g., Freesia Bloom, Bluebells Bloom)")
    batch_number = models.PositiveIntegerField(blank=True, null=True, help_text="Batch number if applicable")
    description = models.TextField(blank=True, null=True)
    teachers = models.ManyToManyField('auth.User', related_name='classrooms', blank=True, help_text="Teachers assigned to this classroom")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name', '-batch_number']
        verbose_name = 'Classroom'
        verbose_name_plural = 'Classrooms'
        unique_together = [['name', 'batch_number']]
    
    def __str__(self):
        if self.batch_number:
            return f"{self.name} - Batch {self.batch_number}"
        return self.name


class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('alumni', 'Alumni'),
        ('dropped', 'Dropped'),
        ('suspended', 'Suspended'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, blank=True, null=True, related_name='students', help_text="Classroom/Batch this student belongs to")
    enrollment_date = models.DateTimeField(default=timezone.now)
    graduation_date = models.DateTimeField(blank=True, null=True)
    profile_photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    # Employment information
    current_job = models.CharField(max_length=200, blank=True, null=True, help_text="Current job title or position")
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Monthly salary")
    job_before_bloom = models.CharField(max_length=200, blank=True, null=True, help_text="Job or status before joining Bloom program")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None
    
    def save(self, *args, **kwargs):
        # Automatically set status to 'alumni' when graduation_date is set
        if self.graduation_date and self.status != 'alumni':
            self.status = 'alumni'
        super().save(*args, **kwargs)
    
    def is_alumni(self):
        """Check if student is an alumni"""
        return self.status == 'alumni'


class AlumniJob(models.Model):
    """Tracks job information for alumni students"""
    
    EMPLOYMENT_STATUS_CHOICES = [
        ('employed', 'Employed'),
        ('looking', 'Looking for Job'),
        ('continuing_studies', 'Continuing Studies'),
        ('not_working', 'Not Working'),
        ('married', 'Married'),
        ('settled', 'Settled'),
    ]
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='alumni_job', limit_choices_to={'status': 'alumni'})
    job_title = models.CharField(max_length=200, blank=True, null=True, help_text="Current job title or position")
    employer = models.CharField(max_length=200, blank=True, null=True, help_text="Company or organization name")
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Monthly salary")
    employment_status = models.CharField(max_length=30, choices=EMPLOYMENT_STATUS_CHOICES, blank=True, null=True)
    job_before_bloom = models.CharField(max_length=200, blank=True, null=True, help_text="Job or status before joining Bloom program")
    start_date = models.DateField(blank=True, null=True, help_text="Job start date")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes about employment")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Alumni Job'
        verbose_name_plural = 'Alumni Jobs'
    
    def __str__(self):
        if self.job_title:
            return f"{self.student.full_name} - {self.job_title}"
        return f"{self.student.full_name} - {self.get_employment_status_display() or 'No Status'}"
