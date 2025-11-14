from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('<int:pk>/upload-photo/', views.upload_student_photo, name='student-upload-photo'),
    path('stats/', views.student_stats, name='student-stats'),
    path('employment-stats/', views.employment_stats, name='employment-stats'),
    
    # Classroom endpoints
    path('classrooms/', views.ClassroomListCreateView.as_view(), name='classroom-list-create'),
    path('classrooms/<int:pk>/', views.ClassroomDetailView.as_view(), name='classroom-detail'),
    path('teacher-classrooms/', views.teacher_classrooms, name='teacher-classrooms'),
    
    # Alumni Job endpoints
    path('alumni-jobs/', views.AlumniJobListCreateView.as_view(), name='alumni-job-list-create'),
    path('alumni-jobs/<int:pk>/', views.AlumniJobDetailView.as_view(), name='alumni-job-detail'),
]
