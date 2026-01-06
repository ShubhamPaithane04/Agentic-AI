"""
Configuration management utilities
"""

import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

def load_config():
    """Load application configuration from environment variables"""
    return {
        'FLASK_APP': os.getenv('FLASK_APP', 'app.py'),
        'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
        'FLASK_DEBUG': os.getenv('FLASK_DEBUG', 'True').lower() == 'true',
        'PORT': int(os.getenv('PORT', 5000)),
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
    }

def get_openai_client():
    """Initialize and return OpenAI client (v0.28.1 format)"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    # Set the API key for the older OpenAI library
    openai.api_key = api_key
    return openai

def validate_config():
    """Validate required configuration settings"""
    config = load_config()
    
    if not config['OPENAI_API_KEY']:
        raise ValueError("OPENAI_API_KEY is required but not set")
    
    return True