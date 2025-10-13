from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Attendance, AttendanceSession
from .serializers import AttendanceSerializer, AttendanceSessionSerializer, AttendanceStatsSerializer
from students.models import Student


class AttendanceListCreateView(generics.ListCreateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    
    def get_queryset(self):
        queryset = Attendance.objects.all()
        student_id = self.request.query_params.get('student_id', None)
        course_id = self.request.query_params.get('course_id', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer


class AttendanceSessionListCreateView(generics.ListCreateAPIView):
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer


class AttendanceSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer


@api_view(['GET'])
def attendance_stats(request):
    """Get attendance statistics for dashboard"""
    student_id = request.query_params.get('student_id', None)
    course_id = request.query_params.get('course_id', None)
    days = int(request.query_params.get('days', 30))
    
    date_from = timezone.now().date() - timedelta(days=days)
    
    queryset = Attendance.objects.filter(date__gte=date_from)
    
    if student_id:
        queryset = queryset.filter(student_id=student_id)
    if course_id:
        queryset = queryset.filter(course_id=course_id)
    
    total_attendance = queryset.count()
    present_count = queryset.filter(status='present').count()
    absent_count = queryset.filter(status='absent').count()
    late_count = queryset.filter(status='late').count()
    excused_count = queryset.filter(status='excused').count()
    
    attendance_percentage = (present_count / total_attendance * 100) if total_attendance > 0 else 0
    
    return Response({
        'total_attendance': total_attendance,
        'present_count': present_count,
        'absent_count': absent_count,
        'late_count': late_count,
        'excused_count': excused_count,
        'attendance_percentage': round(attendance_percentage, 2),
    })


@api_view(['GET'])
def student_attendance_stats(request, student_id):
    """Get detailed attendance statistics for a specific student"""
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    days = int(request.query_params.get('days', 30))
    date_from = timezone.now().date() - timedelta(days=days)
    
    attendances = Attendance.objects.filter(
        student=student,
        date__gte=date_from
    )
    
    total_sessions = attendances.count()
    present_count = attendances.filter(status='present').count()
    absent_count = attendances.filter(status='absent').count()
    late_count = attendances.filter(status='late').count()
    excused_count = attendances.filter(status='excused').count()
    
    attendance_percentage = (present_count / total_sessions * 100) if total_sessions > 0 else 0
    
    data = {
        'student_id': student.id,
        'student_name': student.full_name,
        'total_sessions': total_sessions,
        'present_count': present_count,
        'absent_count': absent_count,
        'late_count': late_count,
        'excused_count': excused_count,
        'attendance_percentage': round(attendance_percentage, 2),
    }
    
    serializer = AttendanceStatsSerializer(data)
    return Response(serializer.data)
