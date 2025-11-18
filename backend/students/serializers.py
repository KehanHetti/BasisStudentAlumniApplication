from rest_framework import serializers
from .models import Student, Classroom, AlumniJob


class ClassroomSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'batch_number', 'description', 'is_active',
            'student_count', 'teachers', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_count(self, obj):
        return obj.students.count()
    
    def get_teachers(self, obj):
        teachers_list = []
        for t in obj.teachers.all():
            full_name = f"{t.first_name or ''} {t.last_name or ''}".strip()
            if not full_name:
                full_name = t.username or t.email or f"User {t.id}"
            teachers_list.append({
                'id': t.id,
                'username': t.username or '',
                'email': t.email or '',
                'full_name': full_name
            })
        return teachers_list


class AlumniJobSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    
    class Meta:
        model = AlumniJob
        fields = [
            'id', 'student', 'student_name', 'student_email', 'job_title',
            'employer', 'salary', 'employment_status', 'job_before_bloom',
            'start_date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    classroom_name = serializers.SerializerMethodField()
    classroom_batch = serializers.SerializerMethodField()
    alumni_job = AlumniJobSerializer(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'gender', 'address', 'status', 'classroom',
            'classroom_name', 'classroom_batch', 'enrollment_date',
            'graduation_date', 'profile_photo', 'profile_photo_url', 'emergency_contact_name',
            'emergency_contact_phone', 'notes', 'age', 'alumni_job',
            'current_job', 'salary', 'job_before_bloom',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_classroom_name(self, obj):
        return obj.classroom.name if obj.classroom else None
    
    def get_classroom_batch(self, obj):
        return obj.classroom.batch_number if obj.classroom else None
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            try:
                # If using Supabase Storage, the URL is already absolute
                photo_url = obj.profile_photo.url
                if photo_url.startswith('http'):
                    return photo_url
                
                # Otherwise, build absolute URL from request
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(photo_url)
                return photo_url
            except Exception as e:
                # If there's an error generating the URL, return None
                # This prevents 500 errors when storage is misconfigured
                return None
        return None


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    classroom_name = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'status',
            'classroom', 'classroom_name', 'enrollment_date', 'profile_photo', 'profile_photo_url'
        ]
    
    def get_classroom_name(self, obj):
        return obj.classroom.name if obj.classroom else None
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            try:
                # If using Supabase Storage, the URL is already absolute
                photo_url = obj.profile_photo.url
                if photo_url.startswith('http'):
                    return photo_url
                
                # Otherwise, build absolute URL from request
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(photo_url)
                return photo_url
            except Exception as e:
                # If there's an error generating the URL, return None
                # This prevents 500 errors when storage is misconfigured
                return None
        return None
