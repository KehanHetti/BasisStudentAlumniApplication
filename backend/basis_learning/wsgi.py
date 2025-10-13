"""
WSGI config for basis_learning project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'basis_learning.settings')

application = get_wsgi_application()
