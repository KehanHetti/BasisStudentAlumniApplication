"""
URL configuration for basis_learning project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/students/', include('students.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/journals/', include('journals.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
