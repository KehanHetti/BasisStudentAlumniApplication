from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Student
from .serializers import StudentSerializer, StudentListSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return StudentListSerializer
        return StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.all()
        status_filter = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


@api_view(['GET'])
def student_stats(request):
    """Get student statistics for dashboard"""
    total_students = Student.objects.count()
    active_students = Student.objects.filter(status='active').count()
    graduated_students = Student.objects.filter(status='graduated').count()
    dropped_students = Student.objects.filter(status='dropped').count()
    
    return Response({
        'total_students': total_students,
        'active_students': active_students,
        'graduated_students': graduated_students,
        'dropped_students': dropped_students,
    })
