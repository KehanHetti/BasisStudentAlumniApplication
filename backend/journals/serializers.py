from rest_framework import serializers
from .models import JournalEntry, JournalGoal
from students.serializers import StudentListSerializer
from courses.serializers import CourseSerializer


class JournalEntrySerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'student', 'student_id', 'course', 'course_id',
            'entry_type', 'title', 'content', 'priority', 'is_private',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JournalGoalSerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = JournalGoal
        fields = [
            'id', 'student', 'student_id', 'title', 'description',
            'target_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JournalStatsSerializer(serializers.Serializer):
    total_entries = serializers.IntegerField()
    progress_entries = serializers.IntegerField()
    achievement_entries = serializers.IntegerField()
    concern_entries = serializers.IntegerField()
    pending_goals = serializers.IntegerField()
    completed_goals = serializers.IntegerField()
