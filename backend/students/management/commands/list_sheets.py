"""
Management command to list all sheets in an Excel file.
"""
from django.core.management.base import BaseCommand
import pandas as pd
import os


class Command(BaseCommand):
    help = 'List all sheets in an Excel file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the Excel file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        try:
            excel_file = pd.ExcelFile(file_path)
            self.stdout.write(f'\nSheets in {os.path.basename(file_path)}:')
            for i, sheet in enumerate(excel_file.sheet_names, 1):
                df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
                self.stdout.write(f'  {i}. {sheet} ({len(pd.read_excel(file_path, sheet_name=sheet))} rows)')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading file: {str(e)}'))


