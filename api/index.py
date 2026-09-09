"""
Vercel Serverless Function Entrypoint for FastAPI Backend.
Exposes the main FastAPI application object 'app' for Vercel Python Runtime.
"""
import sys
import os

# Add root project directory to sys.path so modules like main, thermal_service, etc. resolve cleanly
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from main import app  # noqa: E402
