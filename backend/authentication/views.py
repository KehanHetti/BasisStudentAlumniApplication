from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from django.urls import reverse
from allauth.socialaccount.models import SocialAccount
from .models import UserProfile, RoleRequest, CourseCode, SystemSettings
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
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
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
    """Create a new course code linked to a course (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    course_id = request.data.get('course_id')
    name = request.data.get('name', '')
    description = request.data.get('description', '')
    max_uses = request.data.get('max_uses', 100)
    
    if not course_id:
        return Response({'error': 'Course ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from courses.models import Course
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Generate unique course code
    code = CourseCode.generate_code()
    
    course_code = CourseCode.objects.create(
        code=code,
        course=course,
        name=course.name,  # Use course name
        description=description or course.description or '',
        max_uses=max_uses,
        created_by=request.user
    )
    
    return Response({
        'id': course_code.id,
        'code': course_code.code,
        'course_id': course_code.course.id if course_code.course else None,
        'course': {
            'id': course_code.course.id,
            'name': course_code.course.name,
            'description': course_code.course.description,
        } if course_code.course else None,
        'name': course_code.get_display_name(),
        'description': course_code.description,
        'max_uses': course_code.max_uses,
        'current_uses': course_code.current_uses,
        'is_active': course_code.is_active,
        'created_at': course_code.created_at,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_course_codes(request):
    """List all course codes (admin only) - only show codes linked to actual courses"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Only show course codes that are linked to actual courses
    course_codes = CourseCode.objects.select_related('course').filter(course__isnull=False).order_by('-created_at')
    
    data = []
    for cc in course_codes:
        data.append({
            'id': cc.id,
            'code': cc.code,
            'course_id': cc.course.id if cc.course else None,
            'course': {
                'id': cc.course.id,
                'name': cc.course.name,
                'description': cc.course.description,
            } if cc.course else None,
            'name': cc.get_display_name(),
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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def google_oauth_url(request):
    """Get Google OAuth authorization URL"""
    try:
        client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
        if not client_id or client_id == '':
            return Response({'error': 'Google OAuth not configured', 'available': False}, status=status.HTTP_200_OK)
    except (KeyError, AttributeError):
        return Response({'error': 'Google OAuth not configured', 'available': False}, status=status.HTTP_200_OK)
    
    # Build the authorization URL
    redirect_uri = request.build_absolute_uri(reverse('google_callback'))
    scope = ' '.join(settings.SOCIALACCOUNT_PROVIDERS['google']['SCOPE'])
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=online"
    )
    
    return Response({'auth_url': auth_url})


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def google_oauth_callback(request):
    """Handle Google OAuth callback and create/login user"""
    import requests
    
    # Google redirects with GET, but we can also accept POST
    code = request.GET.get('code') or request.data.get('code')
    if not code:
        return Response({'error': 'Authorization code missing'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Exchange code for token
        client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
        client_secret = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret']
        redirect_uri = request.build_absolute_uri(reverse('google_callback'))
        
        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        })
        
        if token_response.status_code != 200:
            return Response({'error': 'Failed to exchange code for token'}, status=status.HTTP_400_BAD_REQUEST)
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        # Get user info from Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return Response({'error': 'Failed to get user info'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email:
            return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        
        if not created:
            # Update user info
            user.first_name = first_name
            user.last_name = last_name
            user.save()
        
        # Get or create profile
        profile, profile_created = UserProfile.objects.get_or_create(user=user)
        if profile_created:
            # Set default role based on email domain
            if '@basislearning.net' in email.lower() or '@basis' in email.lower():
                profile.role = 'teacher'
            else:
                profile.role = 'teacher'  # Default
            profile.is_verified = True
            profile.save()
        
        # Create or get token
        token, token_created = Token.objects.get_or_create(user=user)
        # Specify backend to avoid "multiple authentication backends" error
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        # If this is a GET request (direct redirect from Google), redirect to frontend
        if request.method == 'GET':
            from django.shortcuts import redirect
            frontend_url = f"http://localhost:3000/auth/login?code={code}&token={token.key}&success=true"
            return redirect(frontend_url)
        
        # If POST (from frontend), return JSON
        return Response({
            'user': UserProfileSerializer(profile).data,
            'token': token.key,
            'message': 'Login successful',
            'created': created
        })
        
    except Exception as e:
        # If GET request and error, redirect to frontend with error
        if request.method == 'GET':
            from django.shortcuts import redirect
            frontend_url = f"http://localhost:3000/auth/login?error={str(e)}"
            return redirect(frontend_url)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def system_settings(request):
    """Get or update system settings (admin only)"""
    if not request.user.profile.is_admin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        settings = SystemSettings.objects.all().order_by('key')
        data = []
        for setting in settings:
            data.append({
                'id': setting.id,
                'key': setting.key,
                'value': setting.value,
                'description': setting.description,
                'value_type': setting.value_type,
                'is_public': setting.is_public,
                'updated_at': setting.updated_at,
                'updated_by': setting.updated_by.get_full_name() if setting.updated_by else None,
            })
        return Response(data)
    
    elif request.method == 'POST':
        key = request.data.get('key')
        value = request.data.get('value')
        description = request.data.get('description', '')
        value_type = request.data.get('value_type', 'string')
        is_public = request.data.get('is_public', False)
        
        if not key:
            return Response({'error': 'Key is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        setting = SystemSettings.set_setting(
            key=key,
            value=value,
            description=description,
            value_type=value_type,
            user=request.user
        )
        setting.is_public = is_public
        setting.save()
        
        return Response({
            'id': setting.id,
            'key': setting.key,
            'value': setting.value,
            'description': setting.description,
            'value_type': setting.value_type,
            'is_public': setting.is_public,
            'updated_at': setting.updated_at,
        }, status=status.HTTP_201_CREATED if not SystemSettings.objects.filter(key=key).exists() else status.HTTP_200_OK)
