from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count
from .models import JournalEntry, JournalGoal
from .serializers import JournalEntrySerializer, JournalGoalSerializer, JournalStatsSerializer


class JournalEntryListCreateView(generics.ListCreateAPIView):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    
    def get_queryset(self):
        queryset = JournalEntry.objects.all()
        student_id = self.request.query_params.get('student_id', None)
        entry_type = self.request.query_params.get('entry_type', None)
        is_private = self.request.query_params.get('is_private', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        if is_private is not None:
            queryset = queryset.filter(is_private=is_private.lower() == 'true')
        
        return queryset


class JournalEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer


class JournalGoalListCreateView(generics.ListCreateAPIView):
    queryset = JournalGoal.objects.all()
    serializer_class = JournalGoalSerializer
    
    def get_queryset(self):
        queryset = JournalGoal.objects.all()
        student_id = self.request.query_params.get('student_id', None)
        status = self.request.query_params.get('status', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset


class JournalGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JournalGoal.objects.all()
    serializer_class = JournalGoalSerializer


@api_view(['GET'])
def journal_stats(request):
    """Get journal statistics for dashboard"""
    student_id = request.query_params.get('student_id', None)
    
    entries_queryset = JournalEntry.objects.all()
    goals_queryset = JournalGoal.objects.all()
    
    if student_id:
        entries_queryset = entries_queryset.filter(student_id=student_id)
        goals_queryset = goals_queryset.filter(student_id=student_id)
    
    total_entries = entries_queryset.count()
    progress_entries = entries_queryset.filter(entry_type='progress').count()
    achievement_entries = entries_queryset.filter(entry_type='achievement').count()
    concern_entries = entries_queryset.filter(entry_type='concern').count()
    
    pending_goals = goals_queryset.filter(status='pending').count()
    completed_goals = goals_queryset.filter(status='completed').count()
    
    data = {
        'total_entries': total_entries,
        'progress_entries': progress_entries,
        'achievement_entries': achievement_entries,
        'concern_entries': concern_entries,
        'pending_goals': pending_goals,
        'completed_goals': completed_goals,
    }
    
    serializer = JournalStatsSerializer(data)
    return Response(serializer.data)
