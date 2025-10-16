from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .models import UserProfile, RoleRequest


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, default='student')
    course_code = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'course_code')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Validate course code
        course_code = attrs.get('course_code')
        if course_code:
            try:
                from .models import CourseCode
                course_code_obj = CourseCode.objects.get(code=course_code)
                if not course_code_obj.is_valid():
                    raise serializers.ValidationError("Invalid or expired course code")
            except CourseCode.DoesNotExist:
                raise serializers.ValidationError("Invalid course code")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role', 'student')
        course_code = validated_data.pop('course_code')
        
        user = User.objects.create_user(**validated_data)
        # Create user profile
        UserProfile.objects.create(user=user, role=role)
        
        # Use the course code
        if course_code:
            from .models import CourseCode
            course_code_obj = CourseCode.objects.get(code=course_code)
            course_code_obj.use_code()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.CharField()  # Changed from EmailField to CharField to accept both email and username
    password = serializers.CharField()
    
    def validate(self, attrs):
        email_or_username = attrs.get('email')
        password = attrs.get('password')
        
        if email_or_username and password:
            user = None
            
            # Try to find user by email first
            if '@' in email_or_username:
                try:
                    user = User.objects.get(email=email_or_username)
                except User.DoesNotExist:
                    pass
            
            # If not found by email, try by username
            if not user:
                try:
                    user = User.objects.get(username=email_or_username)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            # Authenticate the user
            user = authenticate(username=user.username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email/username and password')
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    full_name = serializers.ReadOnlyField()
    email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'role', 'phone', 'is_verified', 'date_joined', 'bio', 'date_of_birth', 'address', 'emergency_contact', 'emergency_phone')
        read_only_fields = ('id', 'email', 'username', 'is_verified', 'date_joined')


class RoleRequestSerializer(serializers.ModelSerializer):
    """Serializer for role change requests"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    requested_role_display = serializers.CharField(source='get_requested_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = RoleRequest
        fields = ('id', 'user', 'user_name', 'requested_role', 'requested_role_display', 'reason', 'status', 'status_display', 'reviewed_by', 'reviewed_at', 'created_at')
        read_only_fields = ('id', 'user', 'status', 'reviewed_by', 'reviewed_at', 'created_at')


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value
