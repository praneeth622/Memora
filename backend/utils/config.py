"""
Configuration utilities for the LiveKit Agent.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for environment variables."""
    
    # LiveKit Configuration
    LIVEKIT_URL: str = os.getenv('LIVEKIT_URL', '')
    LIVEKIT_API_KEY: str = os.getenv('LIVEKIT_API_KEY', '')
    LIVEKIT_API_SECRET: str = os.getenv('LIVEKIT_API_SECRET', '')
    
    # Gemini AI Configuration  
    GEMINI_API_KEY: str = os.getenv('GEMINI_API_KEY', '')
    
    # mem0 Configuration
    MEM0_API_KEY: str = os.getenv('MEM0_API_KEY', '')
    
    # Application Configuration
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    AGENT_NAME: str = os.getenv('AGENT_NAME', 'AI-Assistant')
    
    @classmethod
    def validate(cls) -> tuple[bool, list[str]]:
        """
        Validate that all required environment variables are set.
        
        Returns:
            Tuple of (is_valid, list_of_missing_variables)
        """
        missing = []
        
        if not cls.LIVEKIT_URL:
            missing.append('LIVEKIT_URL')
        if not cls.LIVEKIT_API_KEY:
            missing.append('LIVEKIT_API_KEY') 
        if not cls.LIVEKIT_API_SECRET:
            missing.append('LIVEKIT_API_SECRET')
        if not cls.GEMINI_API_KEY:
            missing.append('GEMINI_API_KEY')
            
        return len(missing) == 0, missing
    
    @classmethod
    def print_config(cls) -> None:
        """Print configuration status (without revealing secrets)."""
        print("Configuration Status:")
        print(f"  LIVEKIT_URL: {'✅' if cls.LIVEKIT_URL else '❌'}")
        print(f"  LIVEKIT_API_KEY: {'✅' if cls.LIVEKIT_API_KEY else '❌'}")
        print(f"  LIVEKIT_API_SECRET: {'✅' if cls.LIVEKIT_API_SECRET else '❌'}")
        print(f"  GEMINI_API_KEY: {'✅' if cls.GEMINI_API_KEY else '❌'}")
        print(f"  MEM0_API_KEY: {'✅' if cls.MEM0_API_KEY else '❌'} (Optional)")
        print(f"  LOG_LEVEL: {cls.LOG_LEVEL}")
        print(f"  AGENT_NAME: {cls.AGENT_NAME}")