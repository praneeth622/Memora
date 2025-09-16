"""
Message Handler Service
Processes incoming chat messages and coordinates AI responses with memory context.
"""

import logging
from typing import List, Dict, Any
from .ai_service import AIService
from .memory_service import MemoryService

logger = logging.getLogger(__name__)

class MessageHandler:
    """
    Core message processing class that coordinates between AI and memory services.
    """
    
    def __init__(self):
        """Initialize the message handler with AI and memory services."""
        self.ai_service = AIService()
        self.memory_service = MemoryService()
        self.logger = logging.getLogger(__name__)
        self.logger.info("MessageHandler initialized")
    
    async def process_message(self, content: str, username: str) -> str:
        """
        Process an incoming message and generate a contextual AI response.
        
        Args:
            content: The message content from the user
            username: The username of the sender
            
        Returns:
            The AI-generated response text
        """
        try:
            self.logger.info(f"Processing message from {username}: {content}")
            
            # Step 1: Get user's conversation history from memory
            user_context = await self.memory_service.get_user_context(username)
            self.logger.info(f"Retrieved {len(user_context)} context items for {username}")
            
            # Step 2: Generate AI response using context
            response = await self.ai_service.generate_response(content, user_context)
            self.logger.info(f"Generated AI response: {response[:100]}...")
            
            # Step 3: Store the interaction for future memory
            await self.memory_service.store_interaction(username, content, response)
            self.logger.info(f"Stored interaction for {username}")
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing message from {username}: {e}")
            return "Sorry, I encountered an error processing your message. Please try again."
    
    async def get_conversation_summary(self, username: str) -> str:
        """
        Get a summary of the user's conversation history.
        
        Args:
            username: The username to get summary for
            
        Returns:
            A summary of the user's conversation history
        """
        try:
            context = await self.memory_service.get_user_context(username)
            if not context:
                return f"This is my first conversation with {username}."
            
            # Generate a summary using AI
            summary_prompt = f"Summarize the conversation history with {username} in 2-3 sentences:"
            context_text = "\n".join([f"User: {item.get('user_message', '')}\nBot: {item.get('bot_response', '')}" 
                                    for item in context[-5:]])  # Last 5 interactions
            
            summary = await self.ai_service.generate_response(
                f"{summary_prompt}\n{context_text}",
                []
            )
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Error generating summary for {username}: {e}")
            return f"I have some conversation history with {username} but can't summarize it right now."