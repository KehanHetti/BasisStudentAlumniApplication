from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from .models import UserProfile, RoleRequest, CourseCode
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    RoleRequestSerializer,
    PasswordChangeSerializer
)


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            profile = user.profile
            return Response({
                'user': UserProfileSerializer(profile).data,
                'token': token.key,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(generics.GenericAPIView):
    """User login endpoint"""
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        print(f"Login attempt with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            print(f"User authenticated: {user.username}")
            token, created = Token.objects.get_or_create(user=user)
            print(f"Token created: {token.key[:10]}...")
            login(request, user)
            profile = user.profile
            user_data = UserProfileSerializer(profile).data
            print(f"User data: {user_data}")
            return Response({
                'user': user_data,
                'token': token.key,
                'message': 'Login successful'
            })
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(generics.GenericAPIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({'message': 'Logout successful'})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class RoleRequestView(generics.ListCreateAPIView):
    """Role change request management"""
    serializer_class = RoleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.profile.is_admin():
            return RoleRequest.objects.all()
        return RoleRequest.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RoleRequestDetailView(generics.RetrieveUpdateAPIView):
    """Individual role request management"""
    serializer_class = RoleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.profile.is_admin():
            return RoleRequest.objects.all()
        return RoleRequest.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_role_request(request, request_id):
    """Approve a role change request (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        role_request = RoleRequest.objects.get(id=request_id, status='pending')
        role_request.user.profile.role = role_request.requested_role
        role_request.user.profile.save()
        
        role_request.status = 'approved'
        role_request.reviewed_by = request.user
        role_request.reviewed_at = timezone.now()
        role_request.save()
        
        return Response({'message': 'Role request approved'})
    except RoleRequest.DoesNotExist:
        return Response({'error': 'Role request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_role_request(request, request_id):
    """Reject a role change request (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        role_request = RoleRequest.objects.get(id=request_id, status='pending')
        role_request.status = 'rejected'
        role_request.reviewed_by = request.user
        role_request.reviewed_at = timezone.now()
        role_request.save()
        
        return Response({'message': 'Role request rejected'})
    except RoleRequest.DoesNotExist:
        return Response({'error': 'Role request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    stats = {
        'total_users': User.objects.count(),
        'students': UserProfile.objects.filter(role='student').count(),
        'teachers': UserProfile.objects.filter(role='teacher').count(),
        'admins': UserProfile.objects.filter(role='admin').count(),
        'pending_requests': RoleRequest.objects.filter(status='pending').count(),
    }
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_course_code(request):
    """Create a new course code (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    name = request.data.get('name')
    description = request.data.get('description', '')
    max_uses = request.data.get('max_uses', 100)
    
    if not name:
        return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate unique course code
    code = CourseCode.generate_code()
    
    course_code = CourseCode.objects.create(
        code=code,
        name=name,
        description=description,
        max_uses=max_uses,
        created_by=request.user
    )
    
    return Response({
        'id': course_code.id,
        'code': course_code.code,
        'name': course_code.name,
        'description': course_code.description,
        'max_uses': course_code.max_uses,
        'current_uses': course_code.current_uses,
        'is_active': course_code.is_active,
        'created_at': course_code.created_at,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_course_codes(request):
    """List all course codes (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    course_codes = CourseCode.objects.all().order_by('-created_at')
    
    data = []
    for cc in course_codes:
        data.append({
            'id': cc.id,
            'code': cc.code,
            'name': cc.name,
            'description': cc.description,
            'max_uses': cc.max_uses,
            'current_uses': cc.current_uses,
            'is_active': cc.is_active,
            'created_at': cc.created_at,
            'expires_at': cc.expires_at,
            'created_by': cc.created_by.get_full_name(),
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_course_code(request, code_id):
    """Toggle course code active status (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        course_code = CourseCode.objects.get(id=code_id)
        course_code.is_active = not course_code.is_active
        course_code.save()
        
        return Response({
            'message': f'Course code {"activated" if course_code.is_active else "deactivated"}',
            'is_active': course_code.is_active
        })
    except CourseCode.DoesNotExist:
        return Response({'error': 'Course code not found'}, status=status.HTTP_404_NOT_FOUND)
