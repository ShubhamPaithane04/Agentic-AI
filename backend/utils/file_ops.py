"""
File operation utilities for generated projects and code management
"""

import os
import datetime
from pathlib import Path

def save_generated_file(content, language="python", project_name=None):
    """Save generated code to a file in the generated_projects directory"""
    
    # Create generated_projects directory if it doesn't exist
    projects_dir = Path("../generated_projects")
    projects_dir.mkdir(exist_ok=True)
    
    # Determine file extension based on language
    extensions = {
        'python': '.py',
        'javascript': '.js',
        'html': '.html',
        'css': '.css',
        'java': '.java',
        'cpp': '.cpp',
        'c': '.c',
        'go': '.go',
        'rust': '.rs',
        'php': '.php'
    }
    
    ext = extensions.get(language.lower(), '.txt')
    
    # Generate filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    if project_name:
        filename = f"{project_name}_{timestamp}{ext}"
    else:
        filename = f"generated_code_{timestamp}{ext}"
    
    filepath = projects_dir / filename
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(filepath)
    except Exception as e:
        raise Exception(f"Failed to save file: {str(e)}")

def create_project_structure(project_name, structure):
    """Create a complete project structure with directories and files"""
    
    projects_dir = Path("../generated_projects")
    project_dir = projects_dir / project_name
    
    try:
        # Create main project directory
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories and files based on structure
        for item in structure:
            if item['type'] == 'directory':
                dir_path = project_dir / item['path']
                dir_path.mkdir(parents=True, exist_ok=True)
            elif item['type'] == 'file':
                file_path = project_dir / item['path']
                file_path.parent.mkdir(parents=True, exist_ok=True)
                
                content = item.get('content', '')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
        
        return str(project_dir)
    except Exception as e:
        raise Exception(f"Failed to create project structure: {str(e)}")

def read_file(filepath):
    """Read content from a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise Exception(f"Failed to read file {filepath}: {str(e)}")

def list_generated_projects():
    """List all generated projects"""
    projects_dir = Path("../generated_projects")
    
    if not projects_dir.exists():
        return []
    
    projects = []
    for item in projects_dir.iterdir():
        if item.is_file():
            projects.append({
                'name': item.name,
                'type': 'file',
                'created': datetime.datetime.fromtimestamp(item.stat().st_mtime),
                'size': item.stat().st_size
            })
        elif item.is_dir():
            projects.append({
                'name': item.name,
                'type': 'directory',
                'created': datetime.datetime.fromtimestamp(item.stat().st_mtime)
            })
    
    return sorted(projects, key=lambda x: x['created'], reverse=True)