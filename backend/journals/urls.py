from django.urls import path
from . import views

urlpatterns = [
    path('entries/', views.JournalEntryListCreateView.as_view(), name='journal-entry-list-create'),
    path('entries/<int:pk>/', views.JournalEntryDetailView.as_view(), name='journal-entry-detail'),
    path('goals/', views.JournalGoalListCreateView.as_view(), name='journal-goal-list-create'),
    path('goals/<int:pk>/', views.JournalGoalDetailView.as_view(), name='journal-goal-detail'),
    path('stats/', views.journal_stats, name='journal-stats'),
]
