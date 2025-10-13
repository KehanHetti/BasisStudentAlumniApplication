from rest_framework import serializers
from .models import Report, ReportTemplate


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'report_type', 'description', 'parameters',
            'generated_by', 'generated_at', 'file_path', 'is_public'
        ]
        read_only_fields = ['id', 'generated_at']


class ReportTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'template_data',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReportDataSerializer(serializers.Serializer):
    report_type = serializers.CharField()
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    student_id = serializers.IntegerField(required=False)
    course_id = serializers.IntegerField(required=False)
    format = serializers.ChoiceField(choices=['json', 'csv', 'pdf'], default='json')
