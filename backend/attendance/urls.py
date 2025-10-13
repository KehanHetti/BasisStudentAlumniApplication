from django.urls import path
from . import views

urlpatterns = [
    path('', views.AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('<int:pk>/', views.AttendanceDetailView.as_view(), name='attendance-detail'),
    path('sessions/', views.AttendanceSessionListCreateView.as_view(), name='attendance-session-list-create'),
    path('sessions/<int:pk>/', views.AttendanceSessionDetailView.as_view(), name='attendance-session-detail'),
    path('stats/', views.attendance_stats, name='attendance-stats'),
    path('stats/student/<int:student_id>/', views.student_attendance_stats, name='student-attendance-stats'),
]
