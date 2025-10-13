from django.urls import path
from . import views

urlpatterns = [
    path('', views.CourseListCreateView.as_view(), name='course-list-create'),
    path('<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/enrollments/', views.CourseWithEnrollmentsView.as_view(), name='course-enrollments'),
    path('enrollments/', views.EnrollmentListCreateView.as_view(), name='enrollment-list-create'),
    path('enrollments/<int:pk>/', views.EnrollmentDetailView.as_view(), name='enrollment-detail'),
    path('stats/', views.course_stats, name='course-stats'),
]
