"""
URL configuration for basis_learning project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),  # Django allauth URLs
    path('api/auth/', include('authentication.urls')),
    path('api/students/', include('students.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/journals/', include('journals.urls')),
    path('api/reports/', include('reports.urls')),
]

# Serve media files in development
# In production, configure your web server (nginx/apache) to serve media files
# or use cloud storage (AWS S3, Google Cloud Storage, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, you should serve media files via nginx/apache
    # or use cloud storage. Uncomment below if you want Django to serve them
    # (NOT recommended for production - use a proper web server instead)
    # urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    pass
