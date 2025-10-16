from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('change-password/', views.change_password, name='change-password'),
    
    # Role management
    path('role-requests/', views.RoleRequestView.as_view(), name='role-requests'),
    path('role-requests/<int:pk>/', views.RoleRequestDetailView.as_view(), name='role-request-detail'),
    path('role-requests/<int:request_id>/approve/', views.approve_role_request, name='approve-role-request'),
    path('role-requests/<int:request_id>/reject/', views.reject_role_request, name='reject-role-request'),
    
    # Course codes (admin only)
    path('course-codes/', views.list_course_codes, name='list-course-codes'),
    path('course-codes/create/', views.create_course_code, name='create-course-code'),
    path('course-codes/<int:code_id>/toggle/', views.toggle_course_code, name='toggle-course-code'),
    
    # Admin only
    path('stats/', views.user_stats, name='user-stats'),
]
