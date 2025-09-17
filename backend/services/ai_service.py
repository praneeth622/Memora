"""
AI Service for generating contextual responses using Gemini AI API.
"""

import logging
import os
from typing import List, Dict, Any
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AIService:
    """
    Service class for handling AI response generation using Gemini AI.
    """
    
    def __init__(self):
        """Initialize the AI service with Gemini client."""
        self.logger = logging.getLogger(__name__)
        
        # Get Gemini API key from environment
        api_key = os.getenv('GEMINI_API_KEY')
        self.model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        
        if not api_key:
            self.logger.error("GEMINI_API_KEY not found in environment variables")
            self.client = None
            self.logger.info("AIService initialized in fallback mode (no API key)")
        else:
            try:
                # Configure Gemini AI
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel(self.model)
                self.logger.info("AIService initialized successfully with Gemini AI")
            except Exception as e:
                self.logger.error(f"Failed to initialize Gemini client: {e}")
                self.logger.error(f"Error details: {type(e).__name__}: {str(e)}")
                self.client = None
                self.logger.info("AIService initialized in fallback mode due to initialization error")
    
    async def generate_response(self, message: str, context: List[Dict[str, Any]]) -> str:
        """
        Generate a contextual AI response based on the message and conversation history.
        
        Args:
            message: The user's message
            context: List of previous conversation context from memory
            
        Returns:
            AI-generated response text
        """
        # Enhanced fallback responses if Gemini client failed to initialize
        if self.client is None:
            # Create more intelligent fallback responses based on message content
            message_lower = message.lower()
            
            if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings']):
                return f"Hello! I received your greeting: '{message}'. I'm your AI assistant, currently running in fallback mode while we resolve some compatibility issues, but I'm here to help!"
            elif any(word in message_lower for word in ['help', 'assist', 'support']):
                return f"I'd be happy to help! You asked: '{message}'. While my full AI capabilities are being restored, I can still provide basic assistance."
            elif any(word in message_lower for word in ['thank', 'thanks']):
                return f"You're welcome! I'm glad I could help. You said: '{message}'. I'm working on getting my advanced AI features online soon!"
            elif '?' in message:
                return f"That's a great question: '{message}'. I'm currently in simplified response mode due to some technical issues, but I'm working on providing better answers soon!"
            else:
                fallback_responses = [
                    f"Thanks for your message: '{message}'. I'm currently running in fallback mode, but I'm here to help!",
                    f"I received your message: '{message}'. My AI service is temporarily simplified, but I can still chat with you!",
                    f"I understand you said: '{message}'. I'm your AI assistant, working on restoring full capabilities!",
                    f"Interesting message: '{message}'. I'm processing in basic mode while technical issues are resolved!"
                ]
                import random
                return random.choice(fallback_responses)
        
        try:
            # Build the conversation context for the AI
            prompt_parts = [self._get_system_prompt()]
            
            # Add conversation history if available
            if context:
                context_text = self._format_context(context)
                prompt_parts.append(f"Previous conversation context:\n{context_text}")
            
            # Add the current user message
            prompt_parts.append(f"User message: {message}")
            prompt_parts.append("Please respond naturally and helpfully:")
            
            # Combine all parts into a single prompt
            full_prompt = "\n\n".join(prompt_parts)
            
            self.logger.info(f"Sending request to Gemini AI")
            
            # Generate response using Gemini
            import asyncio
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.generate_content(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=150,  # Keep responses concise
                        temperature=0.7,  # Balance creativity and consistency
                    )
                )
            )
            
            generated_text = response.text.strip()
            self.logger.info(f"Generated response: {generated_text[:50]}...")
            
            return generated_text
            
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return "I'm having trouble generating a response right now. Please try again in a moment."
    
    def _get_system_prompt(self) -> str:
        """
        Get the system prompt that defines the AI's behavior.
        
        Returns:
            System prompt string
        """
        return """You are a helpful and friendly AI assistant in a chat room. 

Key guidelines:
- Be conversational and engaging
- Remember context from previous messages when provided
- Keep responses concise (1-3 sentences typically)
- Be helpful and try to answer questions accurately
- If you don't know something, admit it honestly
- Use a friendly, approachable tone
- You can use emojis sparingly to add personality
- If someone greets you, greet them back warmly

You have access to conversation history to provide contextual responses."""
    
    def _format_context(self, context: List[Dict[str, Any]]) -> str:
        """
        Format conversation context for the AI prompt.
        
        Args:
            context: List of conversation context items
            
        Returns:
            Formatted context string
        """
        formatted_lines = []
        
        # Take the last 5 interactions to avoid token limits
        recent_context = context[-5:] if len(context) > 5 else context
        
        for item in recent_context:
            user_msg = item.get('user_message', '')
            bot_response = item.get('bot_response', '')
            
            if user_msg and bot_response:
                formatted_lines.append(f"User: {user_msg}")
                formatted_lines.append(f"Assistant: {bot_response}")
        
        return "\n".join(formatted_lines)
    
    async def test_connection(self) -> bool:
        """
        Test the OpenAI API connection.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            self.logger.info("OpenAI API connection test successful")
            return True
        except Exception as e:
            self.logger.error(f"OpenAI API connection test failed: {e}")
            return False