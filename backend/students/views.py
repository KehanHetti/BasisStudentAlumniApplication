from rest_framework import generics, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import logging
import traceback
from django.db.models import Q, Avg, Count, Min, Max
from .models import Student, Classroom, AlumniJob
from .serializers import StudentSerializer, StudentListSerializer, ClassroomSerializer, AlumniJobSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return StudentListSerializer
        return StudentSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            # Log the error for debugging
            logger = logging.getLogger(__name__)
            error_trace = traceback.format_exc()
            logger.error(f"Error serializing students: {str(e)}\n{error_trace}")
            
            # Try to identify which student is causing the issue
            try:
                queryset = self.get_queryset()
                logger.error(f"Total students in queryset: {queryset.count()}")
                # Try to serialize first few students individually to find the problematic one
                for idx, student in enumerate(queryset[:10]):
                    try:
                        serializer = self.get_serializer(student)
                        serializer.data
                    except Exception as student_error:
                        logger.error(f"Student {student.id} ({student.email}) causes error: {student_error}")
            except Exception as debug_error:
                logger.error(f"Error during debugging: {debug_error}")
            
            # Return a more helpful error response
            return Response(
                {'error': f'Error loading students: {str(e)}', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_queryset(self):
        queryset = Student.objects.select_related('classroom', 'alumni_job').all()
        status_filter = self.request.query_params.get('status', None)
        classroom_filter = self.request.query_params.get('classroom', None)
        search = self.request.query_params.get('search', None)
        all_students = self.request.query_params.get('all', None)  # New parameter to get all students
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if classroom_filter:
            queryset = queryset.filter(classroom_id=classroom_filter)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset
    
    def paginate_queryset(self, queryset):
        # If 'all' parameter is set, don't paginate
        if self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_student_photo(request, pk):
    """Upload or update student profile photo"""
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if 'profile_photo' not in request.FILES:
        return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    student.profile_photo = request.FILES['profile_photo']
    student.save()
    
    serializer = StudentSerializer(student, context={'request': request})
    return Response({
        'message': 'Photo uploaded successfully',
        'student': serializer.data
    })


@api_view(['GET'])
def student_stats(request):
    """Get student statistics for dashboard"""
    classroom_filter = request.query_params.get('classroom', None)
    
    queryset = Student.objects.all()
    if classroom_filter:
        queryset = queryset.filter(classroom_id=classroom_filter)
    
    total_students = queryset.count()
    active_students = queryset.filter(status='active').count()
    alumni_students = queryset.filter(status='alumni').count()
    dropped_students = queryset.filter(status='dropped').count()
    
    # Get alumni employment stats
    alumni_with_jobs = AlumniJob.objects.filter(student__status='alumni').count()
    if classroom_filter:
        alumni_with_jobs = AlumniJob.objects.filter(
            student__status='alumni',
            student__classroom_id=classroom_filter
        ).count()
    
    return Response({
        'total_students': total_students,
        'active_students': active_students,
        'alumni_students': alumni_students,
        'dropped_students': dropped_students,
        'alumni_with_jobs': alumni_with_jobs,
    })


@api_view(['GET'])
def employment_stats(request):
    """Get employment and salary statistics for impact visualizations"""
    import re
    from decimal import Decimal
    
    # Get all students
    all_students = Student.objects.all()
    total_students = all_students.count()
    
    # Students with actual jobs (exclude "continuing studies", "looking for job", etc.)
    # These are not considered employment
    non_employment_keywords = [
        'continuing', 'studies', 'looking for', 'looking for job', 'looking for the job',
        'looking for part time', 'married', 'have months baby', 'parents will not allow',
        'husband not allow', 'not working', 'settled', 'n/a', 'no job'
    ]
    
    # Build query to exclude non-employment statuses
    exclusion_query = Q()
    for keyword in non_employment_keywords:
        exclusion_query |= Q(current_job__icontains=keyword)
    
    # Students with actual jobs (have current_job, not empty, and not a non-employment status)
    students_with_jobs = all_students.filter(
        Q(current_job__isnull=False) & 
        ~Q(current_job='') &
        ~exclusion_query
    )
    working_count = students_with_jobs.count()
    employment_rate = round((working_count / total_students * 100), 1) if total_students > 0 else 0
    
    # Average salary of working students
    working_with_salary = students_with_jobs.exclude(salary__isnull=True).exclude(salary=0)
    avg_salary = working_with_salary.aggregate(avg=Avg('salary'))['avg']
    avg_salary_value = float(avg_salary) if avg_salary else 0
    
    # Salary statistics
    salary_stats = working_with_salary.aggregate(
        avg=Avg('salary'),
        min=Min('salary'),
        max=Max('salary')
    )
    
    # Students with job_before_bloom data
    students_with_before = all_students.filter(
        Q(job_before_bloom__isnull=False) & ~Q(job_before_bloom='') & ~Q(job_before_bloom__iexact='n/a')
    )
    
    # Calculate salary improvement (before vs after)
    # Students who have both before and after salary data
    improvement_data = []
    for student in students_with_before:
        if student.salary and student.job_before_bloom:
            # Try to extract salary from job_before_bloom if it contains a number
            before_salary = None
            if student.job_before_bloom:
                import re
                numbers = re.findall(r'\d+', str(student.job_before_bloom))
                if numbers:
                    before_salary = float(numbers[0])
            
            if before_salary and student.salary:
                improvement = float(student.salary) - before_salary
                improvement_data.append({
                    'student_id': student.id,
                    'name': student.full_name,
                    'before': before_salary,
                    'after': float(student.salary),
                    'improvement': improvement,
                    'improvement_percent': round((improvement / before_salary * 100), 1) if before_salary > 0 else 0
                })
    
    avg_improvement = sum(d['improvement'] for d in improvement_data) / len(improvement_data) if improvement_data else 0
    avg_improvement_percent = sum(d['improvement_percent'] for d in improvement_data) / len(improvement_data) if improvement_data else 0
    
    # Job categories breakdown
    job_categories = {}
    for student in students_with_jobs:
        job = student.current_job.lower() if student.current_job else ''
        if 'teacher' in job or 'teaching' in job:
            job_categories['Education'] = job_categories.get('Education', 0) + 1
        elif 'call' in job or 'center' in job or 'centre' in job:
            job_categories['Call Center'] = job_categories.get('Call Center', 0) + 1
        elif 'office' in job or 'admin' in job or 'receptionist' in job:
            job_categories['Office/Admin'] = job_categories.get('Office/Admin', 0) + 1
        elif 'house' in job or 'maid' in job or 'keeping' in job:
            job_categories['Housekeeping'] = job_categories.get('Housekeeping', 0) + 1
        elif 'beautician' in job or 'parlour' in job or 'makeup' in job:
            job_categories['Beauty Services'] = job_categories.get('Beauty Services', 0) + 1
        elif 'field' in job or 'worker' in job or 'ngo' in job:
            job_categories['Field Work/NGO'] = job_categories.get('Field Work/NGO', 0) + 1
        elif 'dentist' in job or 'clinic' in job or 'hospital' in job:
            job_categories['Healthcare'] = job_categories.get('Healthcare', 0) + 1
        elif 'continuing' in job or 'studies' in job:
            job_categories['Continuing Studies'] = job_categories.get('Continuing Studies', 0) + 1
        elif 'looking' in job or 'job' in job:
            job_categories['Looking for Job'] = job_categories.get('Looking for Job', 0) + 1
        else:
            job_categories['Other'] = job_categories.get('Other', 0) + 1
    
    # Status breakdown
    status_breakdown = {
        'Working': working_count,
        'Not Working': total_students - working_count,
    }
    
    return Response({
        'total_students': total_students,
        'working_count': working_count,
        'employment_rate': employment_rate,
        'avg_salary': round(avg_salary_value, 2),
        'salary_stats': {
            'avg': float(salary_stats['avg']) if salary_stats['avg'] else 0,
            'min': float(salary_stats['min']) if salary_stats['min'] else 0,
            'max': float(salary_stats['max']) if salary_stats['max'] else 0,
        },
        'job_categories': job_categories,
        'status_breakdown': status_breakdown,
        'improvement_stats': {
            'students_with_data': len(improvement_data),
            'avg_improvement': round(avg_improvement, 2),
            'avg_improvement_percent': round(avg_improvement_percent, 1),
        },
    })


class ClassroomListCreateView(generics.ListCreateAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    
    def get_queryset(self):
        queryset = Classroom.objects.prefetch_related('teachers', 'students').all()
        # If user is a teacher, filter to show only their classrooms
        if self.request.user.is_authenticated:
            user_profile = getattr(self.request.user, 'profile', None)
            if user_profile and user_profile.role == 'teacher':
                queryset = queryset.filter(teachers=self.request.user)
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer


class AlumniJobListCreateView(generics.ListCreateAPIView):
    queryset = AlumniJob.objects.select_related('student').all()
    serializer_class = AlumniJobSerializer
    
    def get_queryset(self):
        queryset = AlumniJob.objects.select_related('student').all()
        classroom_filter = self.request.query_params.get('classroom', None)
        status_filter = self.request.query_params.get('employment_status', None)
        
        if classroom_filter:
            queryset = queryset.filter(student__classroom_id=classroom_filter)
        
        if status_filter:
            queryset = queryset.filter(employment_status=status_filter)
        
        return queryset


class AlumniJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AlumniJob.objects.all()
    serializer_class = AlumniJobSerializer


@api_view(['GET'])
def teacher_classrooms(request):
    """Get classrooms assigned to the current teacher"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    classrooms = Classroom.objects.filter(teachers=request.user, is_active=True).prefetch_related('students')
    serializer = ClassroomSerializer(classrooms, many=True, context={'request': request})
    return Response(serializer.data)
