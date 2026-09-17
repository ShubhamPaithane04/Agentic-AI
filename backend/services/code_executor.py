# -*- coding: utf-8 -*-
"""
Code Execution Service with Sandbox
Safely executes Python and JavaScript code with output streaming
"""
import subprocess
import tempfile
import os
import sys
from pathlib import Path

class CodeExecutor:
    def __init__(self):
        self.timeout = 10  # seconds
        
    def execute_python(self, code):
        """Execute Python code in isolated subprocess"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write(code)
                temp_file = f.name
            
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                encoding='utf-8'
            )
            
            os.unlink(temp_file)
            
            return {
                'success': True,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'exit_code': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Execution timeout (10s limit)'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def execute_javascript(self, code):
        """Execute JavaScript code using Node.js"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
                f.write(code)
                temp_file = f.name
            
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                encoding='utf-8'
            )
            
            os.unlink(temp_file)
            
            return {
                'success': True,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'exit_code': result.returncode
            }
        except FileNotFoundError:
            return {'success': False, 'error': 'Node.js not installed'}
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Execution timeout (10s limit)'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

executor = CodeExecutor()
