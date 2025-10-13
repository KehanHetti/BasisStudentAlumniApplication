from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('templates/', views.ReportTemplateListCreateView.as_view(), name='report-template-list-create'),
    path('templates/<int:pk>/', views.ReportTemplateDetailView.as_view(), name='report-template-detail'),
    path('generate/', views.generate_report, name='generate-report'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
]
