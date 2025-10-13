from rest_framework import serializers
from .models import Course, Enrollment
from students.serializers import StudentListSerializer


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'level', 'duration_weeks',
            'max_students', 'status', 'start_date', 'end_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_id', 'course', 'course_name',
            'enrollment_date', 'completion_date', 'grade', 'is_completed',
            'notes'
        ]
        read_only_fields = ['id', 'enrollment_date']


class CourseWithEnrollmentsSerializer(serializers.ModelSerializer):
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'level', 'duration_weeks',
            'max_students', 'status', 'start_date', 'end_date',
            'enrollments', 'enrolled_count', 'created_at', 'updated_at'
        ]
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.count()
