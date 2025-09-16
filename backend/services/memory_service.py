"""
Memory Service for storing and retrieving conversation context using mem0.ai.
"""

import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from mem0 import Memory

logger = logging.getLogger(__name__)

class MemoryService:
    """
    Service class for handling conversation memory using mem0.ai.
    """
    
    def __init__(self):
        """Initialize the memory service with mem0 client."""
        try:
            # Initialize mem0 Memory client
            self.memory = Memory()
            self.logger = logging.getLogger(__name__)
            self.logger.info("MemoryService initialized with mem0.ai")
        except Exception as e:
            self.logger.error(f"Failed to initialize mem0 client: {e}")
            self.memory = None
    
    async def get_user_context(self, username: str) -> List[Dict[str, Any]]:
        """
        Retrieve conversation context for a specific user.
        
        Args:
            username: The username to retrieve context for
            
        Returns:
            List of conversation context items
        """
        try:
            if not self.memory:
                self.logger.warning("mem0 client not available, returning empty context")
                return []
            
            # Search for memories related to this user
            memories = self.memory.search(
                query=f"conversations with {username}",
                user_id=username
            )
            
            self.logger.info(f"Retrieved {len(memories)} memories for {username}")
            
            # Format memories for AI context
            context_items = []
            for memory in memories:
                context_items.append({
                    'user_message': memory.get('user_message', ''),
                    'bot_response': memory.get('bot_response', ''),
                    'timestamp': memory.get('timestamp', ''),
                    'summary': memory.get('summary', '')
                })
            
            return context_items
            
        except Exception as e:
            self.logger.error(f"Error retrieving context for {username}: {e}")
            return []
    
    async def store_interaction(self, username: str, user_message: str, bot_response: str) -> bool:
        """
        Store a new conversation interaction for future context.
        
        Args:
            username: The username of the user
            user_message: The user's message
            bot_response: The bot's response
            
        Returns:
            True if storage was successful, False otherwise
        """
        try:
            if not self.memory:
                self.logger.warning("mem0 client not available, skipping storage")
                return False
            
            # Create a memory entry for this interaction
            interaction_data = {
                "user_message": user_message,
                "bot_response": bot_response,
                "timestamp": datetime.now().isoformat(),
                "conversation_type": "chat_room"
            }
            
            # Store in mem0
            result = self.memory.add(
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": bot_response}
                ],
                user_id=username,
                metadata=interaction_data
            )
            
            self.logger.info(f"Stored interaction for {username}: {len(user_message)} chars message")
            return True
            
        except Exception as e:
            self.logger.error(f"Error storing interaction for {username}: {e}")
            return False
    
    async def get_user_summary(self, username: str) -> Optional[str]:
        """
        Get a summary of what we know about a user from memory.
        
        Args:
            username: The username to get summary for
            
        Returns:
            Summary string or None if no data available
        """
        try:
            if not self.memory:
                return None
            
            # Get all memories for this user
            memories = self.memory.get_all(user_id=username)
            
            if not memories:
                return None
            
            # Extract key information
            interaction_count = len(memories)
            recent_topics = []
            
            for memory in memories[-3:]:  # Last 3 interactions
                content = memory.get('content', '')
                if content:
                    recent_topics.append(content[:50] + "..." if len(content) > 50 else content)
            
            summary = f"User {username}: {interaction_count} previous interactions"
            if recent_topics:
                summary += f". Recent topics: {', '.join(recent_topics)}"
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Error getting user summary for {username}: {e}")
            return None
    
    async def clear_user_memory(self, username: str) -> bool:
        """
        Clear all memories for a specific user (for testing/reset purposes).
        
        Args:
            username: The username to clear memories for
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.memory:
                return False
            
            # Delete all memories for this user
            memories = self.memory.get_all(user_id=username)
            for memory in memories:
                self.memory.delete(memory_id=memory.get('id'))
            
            self.logger.info(f"Cleared all memories for {username}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error clearing memories for {username}: {e}")
            return False
    
    async def test_connection(self) -> bool:
        """
        Test the mem0 connection.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            if not self.memory:
                return False
            
            # Try to add and retrieve a test memory
            test_result = self.memory.add(
                messages=[{"role": "user", "content": "test"}],
                user_id="test_user"
            )
            
            self.logger.info("mem0 connection test successful")
            return True
        except Exception as e:
            self.logger.error(f"mem0 connection test failed: {e}")
            return False