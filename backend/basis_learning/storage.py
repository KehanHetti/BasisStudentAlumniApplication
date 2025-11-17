"""
Custom Django storage backend for Supabase Storage
"""
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
from supabase import create_client, Client
import os
from urllib.parse import urljoin


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
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def _open(self, name, mode='rb'):
        """
        Retrieve the specified file from Supabase Storage
        """
        try:
            response = self.client.storage.from_(self.bucket_name).download(name)
            if isinstance(response, bytes):
                return ContentFile(response)
            else:
                # If response is a file-like object, read it
                return ContentFile(response.read() if hasattr(response, 'read') else response)
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
            
            # Upload to Supabase Storage
            self.client.storage.from_(self.bucket_name).upload(
                name,
                file_data,
                file_options={"content-type": content.content_type} if hasattr(content, 'content_type') else {}
            )
            
            return name
        except Exception as e:
            raise IOError(f"Error saving file {name}: {str(e)}")
    
    def delete(self, name):
        """
        Delete the specified file from Supabase Storage
        """
        try:
            self.client.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            raise IOError(f"Error deleting file {name}: {str(e)}")
    
    def exists(self, name):
        """
        Check if the file exists in Supabase Storage
        """
        try:
            files = self.client.storage.from_(self.bucket_name).list(name)
            # Check if the file exists in the list
            for file_info in files:
                if file_info.get('name') == os.path.basename(name):
                    return True
            return False
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
            files = self.client.storage.from_(self.bucket_name).list(name)
            for file_info in files:
                if file_info.get('name') == os.path.basename(name):
                    return file_info.get('metadata', {}).get('size', 0)
            return 0
        except:
            return 0

