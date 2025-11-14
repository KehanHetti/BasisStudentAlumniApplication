"""
Custom account adapter for django-allauth to integrate with our UserProfile model
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User
from .models import UserProfile


class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom account adapter"""
    
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit)
        if commit:
            # Create or get UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                # Set default role based on email domain or other logic
                profile.role = 'teacher'  # Default for staff/admin
                profile.save()
        return user


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom social account adapter for Google OAuth"""
    
    def pre_social_login(self, request, sociallogin):
        """Called before social login completes"""
        pass
    
    def populate_user(self, request, sociallogin, data):
        """Populate user data from social account"""
        user = super().populate_user(request, sociallogin, data)
        return user
    
    def save_user(self, request, sociallogin, form=None):
        """Save user and create profile"""
        user = super().save_user(request, sociallogin, form)
        # Create or get UserProfile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if created:
            # Set default role - you can customize this logic
            # For example, check email domain to determine role
            email = user.email.lower()
            if '@basislearning.net' in email or '@basis' in email:
                profile.role = 'teacher'  # Staff/admin
            else:
                profile.role = 'teacher'  # Default to teacher for now
            profile.is_verified = True  # Google accounts are verified
            profile.save()
        return user

