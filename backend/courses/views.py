from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count
from .models import Course, Enrollment
from .serializers import CourseSerializer, EnrollmentSerializer, CourseWithEnrollmentsSerializer


class IsAdminOrTeacher(permissions.BasePermission):
    """Permission check for admin or teacher"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
        return profile.is_admin() or profile.is_teacher()


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminOrTeacher()]


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminOrTeacher()]


class CourseWithEnrollmentsView(generics.RetrieveAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseWithEnrollmentsSerializer


class EnrollmentListCreateView(generics.ListCreateAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def get_queryset(self):
        queryset = Enrollment.objects.all()
        student_id = self.request.query_params.get('student_id', None)
        course_id = self.request.query_params.get('course_id', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer


@api_view(['GET'])
def course_stats(request):
    """Get course statistics for dashboard"""
    total_courses = Course.objects.count()
    active_courses = Course.objects.filter(status='active').count()
    total_enrollments = Enrollment.objects.count()
    completed_enrollments = Enrollment.objects.filter(is_completed=True).count()
    
    return Response({
        'total_courses': total_courses,
        'active_courses': active_courses,
        'total_enrollments': total_enrollments,
        'completed_enrollments': completed_enrollments,
    })
