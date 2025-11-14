#!/bin/bash
# Build script for Render.com deployment
# This ensures Python 3.12 is used and dependencies are installed correctly

set -e

echo "Building application for Render.com..."

# Check Python version
python --version

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

echo "Build completed successfully!"

