from django.db import models
from django.contrib.auth.models import User
import secrets
import string


class UserProfile(models.Model):
    """Extended user profile information"""
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} Profile"
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
    def is_student(self):
        return self.role == 'student'
    
    def is_teacher(self):
        return self.role == 'teacher'
    
    def is_admin(self):
        return self.role == 'admin'


class CourseCode(models.Model):
    """Course codes for registration access control - linked to actual courses"""
    
    code = models.CharField(max_length=20, unique=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='course_codes', null=True, blank=True)
    name = models.CharField(max_length=100, help_text="Override name if not using a course")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(default=100, help_text="Maximum number of registrations allowed")
    current_uses = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_course_codes')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        course_name = self.course.name if self.course else self.name
        return f"{course_name} ({self.code})"
    
    def get_display_name(self):
        """Get the course name or override name"""
        return self.course.name if self.course else self.name
    
    @classmethod
    def generate_code(cls, length=8):
        """Generate a random course code"""
        characters = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(characters) for _ in range(length))
            if not cls.objects.filter(code=code).exists():
                return code
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if the course code is valid and can be used"""
        if not self.is_active:
            return False
        if self.current_uses >= self.max_uses:
            return False
        if self.expires_at and models.timezone.now() > self.expires_at:
            return False
        return True
    
    def use_code(self):
        """Increment the usage count"""
        if self.is_valid():
            self.current_uses += 1
            self.save()
            return True
        return False


class RoleRequest(models.Model):
    """Model for handling role change requests"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_requests')
    requested_role = models.CharField(max_length=20, choices=UserProfile.ROLE_CHOICES)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_requested_role_display()} Request"


class SystemSettings(models.Model):
    """System-wide settings and configuration"""
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True)
    description = models.CharField(max_length=255, blank=True)
    value_type = models.CharField(
        max_length=20,
        choices=[
            ('string', 'String'),
            ('integer', 'Integer'),
            ('boolean', 'Boolean'),
            ('json', 'JSON'),
        ],
        default='string'
    )
    is_public = models.BooleanField(default=False, help_text="Public settings can be accessed without authentication")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['key']
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key"""
        try:
            setting = cls.objects.get(key=key)
            if setting.value_type == 'boolean':
                return setting.value.lower() in ('true', '1', 'yes', 'on')
            elif setting.value_type == 'integer':
                try:
                    return int(setting.value)
                except ValueError:
                    return default
            elif setting.value_type == 'json':
                import json
                try:
                    return json.loads(setting.value)
                except json.JSONDecodeError:
                    return default
            return setting.value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, description='', value_type='string', user=None):
        """Set a setting value"""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': str(value),
                'description': description,
                'value_type': value_type,
            }
        )
        if not created:
            setting.value = str(value)
            setting.description = description or setting.description
            setting.value_type = value_type
            if user:
                setting.updated_by = user
            setting.save()
        return setting
