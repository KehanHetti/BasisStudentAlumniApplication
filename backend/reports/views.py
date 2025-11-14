from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django.http import HttpResponse, FileResponse
from django.conf import settings
from datetime import datetime, timedelta
import json
import csv
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from .models import Report, ReportTemplate
from .serializers import ReportSerializer, ReportTemplateSerializer, ReportDataSerializer
from students.models import Student
from courses.models import Course, Enrollment
from attendance.models import Attendance
from journals.models import JournalEntry


class ReportListCreateView(generics.ListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        # Delete the associated file if it exists
        if instance.file_path and os.path.exists(instance.file_path):
            try:
                os.remove(instance.file_path)
            except Exception as e:
                # Log error but don't fail deletion if file removal fails
                print(f"Error deleting report file: {e}")
        # Delete the database record
        instance.delete()


class ReportTemplateListCreateView(generics.ListCreateAPIView):
    queryset = ReportTemplate.objects.filter(is_active=True)
    serializer_class = ReportTemplateSerializer


class ReportTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_report(request):
    """Generate a report based on parameters"""
    serializer = ReportDataSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    report_type = data['report_type']
    date_from = data.get('date_from')
    date_to = data.get('date_to')
    student_id = data.get('student_id')
    course_id = data.get('course_id')
    
    # Set default date range if not provided
    if not date_from:
        date_from = timezone.now().date() - timedelta(days=30)
    if not date_to:
        date_to = timezone.now().date()
    
    report_data = {}
    
    if report_type == 'attendance':
        queryset = Attendance.objects.filter(date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_records': queryset.count(),
            'present_count': queryset.filter(status='present').count(),
            'absent_count': queryset.filter(status='absent').count(),
            'late_count': queryset.filter(status='late').count(),
            'excused_count': queryset.filter(status='excused').count(),
            'attendance_percentage': round(
                queryset.filter(status='present').count() / queryset.count() * 100, 2
            ) if queryset.count() > 0 else 0,
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'date', 'status', 'notes'
            ))
        }
    
    elif report_type == 'enrollment':
        queryset = Enrollment.objects.filter(enrollment_date__date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_enrollments': queryset.count(),
            'completed_enrollments': queryset.filter(is_completed=True).count(),
            'completion_rate': round(
                queryset.filter(is_completed=True).count() / queryset.count() * 100, 2
            ) if queryset.count() > 0 else 0,
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'enrollment_date', 'completion_date', 'is_completed', 'grade'
            ))
        }
    
    elif report_type == 'progress':
        queryset = JournalEntry.objects.filter(created_at__date__range=[date_from, date_to])
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        report_data = {
            'total_entries': queryset.count(),
            'progress_entries': queryset.filter(entry_type='progress').count(),
            'achievement_entries': queryset.filter(entry_type='achievement').count(),
            'concern_entries': queryset.filter(entry_type='concern').count(),
            'data': list(queryset.values(
                'student__first_name', 'student__last_name', 'course__name',
                'entry_type', 'title', 'priority', 'created_at'
            ))
        }
    
    # Generate file based on format
    format_type = data.get('format', 'pdf')  # Default to PDF
    file_path = None
    
    # Create reports directory if it doesn't exist
    reports_dir = os.path.join(settings.BASE_DIR, 'reports', 'generated')
    os.makedirs(reports_dir, exist_ok=True)
    
    # Generate filename
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{report_type}_{timestamp}.{format_type}"
    file_path = os.path.join(reports_dir, filename)
    
    # Write file based on format
    if format_type == 'pdf':
        file_path = _generate_pdf_report(report_type, report_data, date_from, date_to, file_path, request.user if request.user.is_authenticated else None)
    elif format_type == 'json':
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump({
                'report_name': f"{report_type.title()} Report",
                'date_from': str(date_from),
                'date_to': str(date_to),
                'generated_at': timezone.now().isoformat(),
                **report_data
            }, f, indent=2, default=str)
    elif format_type == 'csv':
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            # Write header
            if report_data.get('data'):
                if report_type == 'attendance':
                    writer.writerow(['Student First Name', 'Student Last Name', 'Course', 'Date', 'Status', 'Notes'])
                    for row in report_data['data']:
                        writer.writerow([
                            row.get('student__first_name', ''),
                            row.get('student__last_name', ''),
                            row.get('course__name', ''),
                            row.get('date', ''),
                            row.get('status', ''),
                            row.get('notes', ''),
                        ])
                elif report_type == 'enrollment':
                    writer.writerow(['Student First Name', 'Student Last Name', 'Course', 'Enrollment Date', 'Completion Date', 'Completed', 'Grade'])
                    for row in report_data['data']:
                        writer.writerow([
                            row.get('student__first_name', ''),
                            row.get('student__last_name', ''),
                            row.get('course__name', ''),
                            row.get('enrollment_date', ''),
                            row.get('completion_date', ''),
                            row.get('is_completed', ''),
                            row.get('grade', ''),
                        ])
                elif report_type == 'progress':
                    writer.writerow(['Student First Name', 'Student Last Name', 'Course', 'Entry Type', 'Title', 'Priority', 'Created At'])
                    for row in report_data['data']:
                        writer.writerow([
                            row.get('student__first_name', ''),
                            row.get('student__last_name', ''),
                            row.get('course__name', ''),
                            row.get('entry_type', ''),
                            row.get('title', ''),
                            row.get('priority', ''),
                            row.get('created_at', ''),
                        ])
    
    # Save report record
    report = Report.objects.create(
        name=f"{report_type.title()} Report - {date_from} to {date_to}",
        report_type=report_type,
        parameters=data,
        generated_by=request.user.username if request.user.is_authenticated else 'Anonymous',
        file_path=file_path
    )
    
    return Response({
        'report_id': report.id,
        'report_name': report.name,
        'file_path': file_path,
        'download_url': f'/api/reports/{report.id}/download/',
        'data': report_data
    })


def _generate_pdf_report(report_type, report_data, date_from, date_to, file_path, user):
    """Generate a professional PDF report"""
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    story = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12
    )
    
    # Title
    title = Paragraph(f"{report_type.replace('_', ' ').title()} Report", title_style)
    story.append(title)
    story.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    meta_data = [
        ['Report Period:', f"{date_from} to {date_to}"],
        ['Generated On:', timezone.now().strftime('%B %d, %Y at %I:%M %p')],
    ]
    if user:
        meta_data.append(['Generated By:', user.get_full_name() or user.username])
    
    meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Summary section
    summary_heading = Paragraph("Summary", heading_style)
    story.append(summary_heading)
    
    if report_type == 'attendance':
        summary_data = [
            ['Metric', 'Value'],
            ['Total Records', str(report_data.get('total_records', 0))],
            ['Present', str(report_data.get('present_count', 0))],
            ['Absent', str(report_data.get('absent_count', 0))],
            ['Late', str(report_data.get('late_count', 0))],
            ['Excused', str(report_data.get('excused_count', 0))],
            ['Attendance Rate', f"{report_data.get('attendance_percentage', 0)}%"],
        ]
    elif report_type == 'enrollment':
        summary_data = [
            ['Metric', 'Value'],
            ['Total Enrollments', str(report_data.get('total_enrollments', 0))],
            ['Completed Enrollments', str(report_data.get('completed_enrollments', 0))],
            ['Completion Rate', f"{report_data.get('completion_rate', 0)}%"],
        ]
    elif report_type == 'progress':
        summary_data = [
            ['Metric', 'Value'],
            ['Total Entries', str(report_data.get('total_entries', 0))],
            ['Progress Entries', str(report_data.get('progress_entries', 0))],
            ['Achievement Entries', str(report_data.get('achievement_entries', 0))],
            ['Concern Entries', str(report_data.get('concern_entries', 0))],
        ]
    else:
        summary_data = [['Metric', 'Value']]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Detailed data section
    if report_data.get('data') and len(report_data['data']) > 0:
        details_heading = Paragraph("Detailed Records", heading_style)
        story.append(details_heading)
        
        # Prepare table data
        if report_type == 'attendance':
            table_data = [['Student Name', 'Course', 'Date', 'Status', 'Notes']]
            for row in report_data['data']:
                student_name = f"{row.get('student__first_name', '')} {row.get('student__last_name', '')}".strip()
                table_data.append([
                    student_name,
                    row.get('course__name', 'N/A'),
                    str(row.get('date', '')),
                    row.get('status', '').title(),
                    row.get('notes', '') or '-'
                ])
        elif report_type == 'enrollment':
            table_data = [['Student Name', 'Course', 'Enrollment Date', 'Completed', 'Grade']]
            for row in report_data['data']:
                student_name = f"{row.get('student__first_name', '')} {row.get('student__last_name', '')}".strip()
                table_data.append([
                    student_name,
                    row.get('course__name', 'N/A'),
                    str(row.get('enrollment_date', ''))[:10] if row.get('enrollment_date') else 'N/A',
                    'Yes' if row.get('is_completed') else 'No',
                    row.get('grade', 'N/A')
                ])
        elif report_type == 'progress':
            table_data = [['Student Name', 'Course', 'Type', 'Title', 'Priority']]
            for row in report_data['data']:
                student_name = f"{row.get('student__first_name', '')} {row.get('student__last_name', '')}".strip()
                table_data.append([
                    student_name,
                    row.get('course__name', 'N/A') or 'General',
                    row.get('entry_type', '').title(),
                    row.get('title', ''),
                    row.get('priority', '').title()
                ])
        else:
            table_data = [['No data available']]
        
        # Create detailed table
        col_widths = [1.5*inch, 1.5*inch, 1*inch, 1*inch, 1.5*inch] if len(table_data[0]) > 3 else [6*inch]
        data_table = Table(table_data, colWidths=col_widths[:len(table_data[0])])
        
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ])
        data_table.setStyle(table_style)
        story.append(data_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer = Paragraph(
        f"<i>This report was generated by Basis Learning Application on {timezone.now().strftime('%B %d, %Y')}</i>",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    )
    story.append(footer)
    
    # Build PDF
    doc.build(story)
    return file_path


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_report(request, pk):
    """Download a generated report file"""
    try:
        report = Report.objects.get(pk=pk)
        
        if not report.file_path:
            return Response({'error': 'Report file not available'}, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure file exists
        if not os.path.exists(report.file_path):
            return Response({'error': 'Report file not found on server'}, status=status.HTTP_404_NOT_FOUND)
        
        # Determine content type based on file extension
        file_ext = os.path.splitext(report.file_path)[1].lower()
        content_types = {
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
        }
        content_type = content_types.get(file_ext, 'application/octet-stream')
        
        # Determine filename
        filename = os.path.basename(report.file_path)
        
        # Open file and create response
        file_handle = open(report.file_path, 'rb')
        response = FileResponse(
            file_handle,
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
    except PermissionError:
        return Response({'error': 'Permission denied accessing file'}, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response({'error': f'Error downloading file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics"""
    # Student stats
    total_students = Student.objects.count()
    active_students = Student.objects.filter(status='active').count()
    alumni_students = Student.objects.filter(status='alumni').count()
    
    # Course stats
    total_courses = Course.objects.count()
    active_courses = Course.objects.filter(status='active').count()
    total_enrollments = Enrollment.objects.count()
    
    # Attendance stats (last 30 days)
    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    attendance_records = Attendance.objects.filter(date__gte=thirty_days_ago)
    total_attendance = attendance_records.count()
    present_count = attendance_records.filter(status='present').count()
    attendance_percentage = round(
        present_count / total_attendance * 100, 2
    ) if total_attendance > 0 else 0
    
    # Journal stats
    total_journal_entries = JournalEntry.objects.count()
    recent_entries = JournalEntry.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    return Response({
        'students': {
            'total': total_students,
            'active': active_students,
            'alumni': alumni_students,
        },
        'courses': {
            'total': total_courses,
            'active': active_courses,
            'enrollments': total_enrollments,
        },
        'attendance': {
            'percentage': attendance_percentage,
            'total_records': total_attendance,
            'present_count': present_count,
        },
        'journals': {
            'total_entries': total_journal_entries,
            'recent_entries': recent_entries,
        }
    })
