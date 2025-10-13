from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Report, ReportTemplate
from .serializers import ReportSerializer, ReportTemplateSerializer, ReportDataSerializer
from students.models import Student
from courses.models import Course, Enrollment
from attendance.models import Attendance
from journals.models import JournalEntry


class ReportListCreateView(generics.ListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer


class ReportTemplateListCreateView(generics.ListCreateAPIView):
    queryset = ReportTemplate.objects.filter(is_active=True)
    serializer_class = ReportTemplateSerializer


class ReportTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer


@api_view(['POST'])
def generate_report(request):
    """Generate a report based on parameters"""
    serializer = ReportDataSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    report_type = data['report_type']
    date_from = data.get('date_from')
    date_to = data.get('date_to')
    student_id = data.get('student_id')
    course_id = data.get('course_id')
    
    # Set default date range if not provided
    if not date_from:
        date_from = timezone.now().date() - timedelta(days=30)
    if not date_to:
        date_to = timezone.now().date()
    
    report_data = {}
    
    if report_type == 'attendance':
        queryset = Attendance.objects.filter(date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_records': queryset.count(),
            'present_count': queryset.filter(status='present').count(),
            'absent_count': queryset.filter(status='absent').count(),
            'late_count': queryset.filter(status='late').count(),
            'excused_count': queryset.filter(status='excused').count(),
            'attendance_percentage': round(
                queryset.filter(status='present').count() / queryset.count() * 100, 2
            ) if queryset.count() > 0 else 0,
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'date', 'status', 'notes'
            ))
        }
    
    elif report_type == 'enrollment':
        queryset = Enrollment.objects.filter(enrollment_date__date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_enrollments': queryset.count(),
            'completed_enrollments': queryset.filter(is_completed=True).count(),
            'completion_rate': round(
                queryset.filter(is_completed=True).count() / queryset.count() * 100, 2
            ) if queryset.count() > 0 else 0,
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'enrollment_date', 'completion_date', 'is_completed', 'grade'
            ))
        }
    
    elif report_type == 'progress':
        queryset = JournalEntry.objects.filter(created_at__date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_entries': queryset.count(),
            'progress_entries': queryset.filter(entry_type='progress').count(),
            'achievement_entries': queryset.filter(entry_type='achievement').count(),
            'concern_entries': queryset.filter(entry_type='concern').count(),
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'entry_type', 'title', 'priority', 'created_at'
            ))
        }
    
    # Save report record
    report = Report.objects.create(
        name=f"{report_type.title()} Report - {date_from} to {date_to}",
        report_type=report_type,
        parameters=data,
        generated_by=request.user.username if request.user.is_authenticated else 'Anonymous'
    )
    
    return Response({
        'report_id': report.id,
        'report_name': report.name,
        'data': report_data
    })


@api_view(['GET'])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics"""
    # Student stats
    total_students = Student.objects.count()
    active_students = Student.objects.filter(status='active').count()
    graduated_students = Student.objects.filter(status='graduated').count()
    
    # Course stats
    total_courses = Course.objects.count()
    active_courses = Course.objects.filter(status='active').count()
    total_enrollments = Enrollment.objects.count()
    
    # Attendance stats (last 30 days)
    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    attendance_records = Attendance.objects.filter(date__gte=thirty_days_ago)
    total_attendance = attendance_records.count()
    present_count = attendance_records.filter(status='present').count()
    attendance_percentage = round(
        present_count / total_attendance * 100, 2
    ) if total_attendance > 0 else 0
    
    # Journal stats
    total_journal_entries = JournalEntry.objects.count()
    recent_entries = JournalEntry.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    return Response({
        'students': {
            'total': total_students,
            'active': active_students,
            'graduated': graduated_students,
        },
        'courses': {
            'total': total_courses,
            'active': active_courses,
            'enrollments': total_enrollments,
        },
        'attendance': {
            'percentage': attendance_percentage,
            'total_records': total_attendance,
            'present_count': present_count,
        },
        'journals': {
            'total_entries': total_journal_entries,
            'recent_entries': recent_entries,
        }
    })
