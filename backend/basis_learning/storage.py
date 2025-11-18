"""
Custom Django storage backend for Supabase Storage
"""
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
from urllib.parse import urljoin
import requests


class SupabaseStorage(Storage):
    """
    Custom storage backend that stores files in Supabase Storage
    """
    
    def __init__(self):
        self.supabase_url = getattr(settings, 'SUPABASE_URL', None)
        self.supabase_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', None)
        self.bucket_name = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'student-photos')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in settings")
        
        # Use REST API directly instead of Python client to avoid proxy issues
        self.base_url = self.supabase_url.rstrip('/')
        self.storage_url = f"{self.base_url}/storage/v1/object"
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
        }
    
    def _open(self, name, mode='rb'):
        """
        Retrieve the specified file from Supabase Storage
        """
        try:
            # Use REST API to download file (try public endpoint first, then authenticated)
            # For public files
            url = f"{self.storage_url}/public/{self.bucket_name}/{name}"
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                return ContentFile(response.content)
            
            # If public fails, try authenticated endpoint
            url = f"{self.storage_url}/{self.bucket_name}/{name}"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return ContentFile(response.content)
        except Exception as e:
            raise IOError(f"Error opening file {name}: {str(e)}")
    
    def _save(self, name, content):
        """
        Save the file to Supabase Storage
        """
        try:
            # Read file content
            content.seek(0)
            file_data = content.read()
            
            # Use REST API to upload file (POST with file in body)
            url = f"{self.storage_url}/{self.bucket_name}/{name}"
            headers = self.headers.copy()
            # Supabase expects Content-Type for the file
            if hasattr(content, 'content_type') and content.content_type:
                headers['Content-Type'] = content.content_type
            else:
                # Default to binary if content type not available
                headers['Content-Type'] = 'application/octet-stream'
            
            # Upload file as raw binary data
            response = requests.post(url, data=file_data, headers=headers, timeout=30)
            response.raise_for_status()
            
            return name
        except Exception as e:
            raise IOError(f"Error saving file {name}: {str(e)}")
    
    def delete(self, name):
        """
        Delete the specified file from Supabase Storage
        """
        try:
            # Use REST API to delete file
            url = f"{self.storage_url}/{self.bucket_name}/{name}"
            response = requests.delete(url, headers=self.headers, timeout=30)
            response.raise_for_status()
        except Exception as e:
            raise IOError(f"Error deleting file {name}: {str(e)}")
    
    def exists(self, name):
        """
        Check if the file exists in Supabase Storage
        """
        try:
            # Use REST API HEAD request to check if file exists
            url = f"{self.storage_url}/public/{self.bucket_name}/{name}"
            response = requests.head(url, headers=self.headers, timeout=10)
            return response.status_code == 200
        except:
            return False
    
    def url(self, name):
        """
        Return the public URL for the file
        Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        """
        if not name:
            return ''
        
        # Construct Supabase Storage public URL
        base_url = self.supabase_url.rstrip('/')
        public_url = f"{base_url}/storage/v1/object/public/{self.bucket_name}/{name}"
        return public_url
    
    def size(self, name):
        """
        Return the total size, in bytes, of the file specified by name
        """
        try:
            # Use REST API HEAD request to get file size
            url = f"{self.storage_url}/public/{self.bucket_name}/{name}"
            response = requests.head(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                content_length = response.headers.get('Content-Length')
                if content_length:
                    return int(content_length)
            return 0
        except:
            return 0

