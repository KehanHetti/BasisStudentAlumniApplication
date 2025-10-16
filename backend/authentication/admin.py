from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, RoleRequest, CourseCode


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """User profile admin"""
    list_display = ('user', 'role', 'phone', 'is_verified', 'created_at')
    list_filter = ('role', 'is_verified', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(RoleRequest)
class RoleRequestAdmin(admin.ModelAdmin):
    """Role request admin"""
    list_display = ('user', 'requested_role', 'status', 'created_at', 'reviewed_by')
    list_filter = ('status', 'requested_role', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'reason')
    readonly_fields = ('created_at', 'reviewed_at')
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        """Approve selected role requests"""
        for role_request in queryset.filter(status='pending'):
            role_request.user.profile.role = role_request.requested_role
            role_request.user.profile.save()
            role_request.status = 'approved'
            role_request.reviewed_by = request.user
            role_request.save()
        self.message_user(request, f"Approved {queryset.count()} role requests")
    
    def reject_requests(self, request, queryset):
        """Reject selected role requests"""
        queryset.filter(status='pending').update(
            status='rejected',
            reviewed_by=request.user
        )
        self.message_user(request, f"Rejected {queryset.count()} role requests")


@admin.register(CourseCode)
class CourseCodeAdmin(admin.ModelAdmin):
    """Course code admin"""
    list_display = ('code', 'name', 'is_active', 'current_uses', 'max_uses', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    readonly_fields = ('code', 'created_at')
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ('current_uses',)
        return self.readonly_fields


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
