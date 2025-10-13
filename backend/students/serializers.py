from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'gender', 'address', 'status', 'enrollment_date',
            'graduation_date', 'profile_photo', 'emergency_contact_name',
            'emergency_contact_phone', 'notes', 'age', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'status',
            'enrollment_date', 'profile_photo'
        ]
