"""
Configuration management utilities
"""

import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(override=True)

def load_config():
    """Load application configuration from environment variables"""
    return {
        'FLASK_APP': os.getenv('FLASK_APP', 'app.py'),
        'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
        'FLASK_DEBUG': os.getenv('FLASK_DEBUG', 'True').lower() == 'true',
        'PORT': int(os.getenv('PORT', 5000)),
        'GROQ_API_KEY': os.getenv('GROQ_API_KEY'),
    }

def get_groq_client():
    """Initialize and return Groq client"""
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    # Initialize the Groq client
    client = Groq(api_key=api_key)
    return client

def validate_config():
    """Validate required configuration settings"""
    config = load_config()
    
    if not config['GROQ_API_KEY']:
        raise ValueError("GROQ_API_KEY is required but not set")
    
    return True