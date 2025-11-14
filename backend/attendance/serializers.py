from rest_framework import serializers
from .models import Attendance, AttendanceSession
from students.serializers import StudentListSerializer, ClassroomSerializer
from courses.serializers import CourseSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    classroom = ClassroomSerializer(read_only=True)
    classroom_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_id', 'course', 'course_id',
            'classroom', 'classroom_id', 'date', 'status', 'notes', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_id', 'date', 'start_time',
            'end_time', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceStatsSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    total_sessions = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    late_count = serializers.IntegerField()
    excused_count = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
