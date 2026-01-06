"""
Utility modules for AI Development Assistant

Shared functionality including configuration management and file operations.
"""

from .config import get_openai_client, load_config
from .file_ops import save_generated_file, create_project_structure

__all__ = ['get_openai_client', 'load_config', 'save_generated_file', 'create_project_structure']