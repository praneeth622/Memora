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
        self.logger = logging.getLogger(__name__)
        
        # Get API keys from environment
        mem0_api_key = os.getenv('MEM0_API_KEY')
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        if not mem0_api_key:
            self.logger.warning("MEM0_API_KEY not found in environment variables")
            self.memory = None
            self.logger.info("MemoryService initialized in fallback mode (no MEM0 API key)")
        elif not gemini_api_key:
            self.logger.warning("GEMINI_API_KEY not found - required for embeddings")
            self.memory = None
            self.logger.info("MemoryService initialized in fallback mode (no Gemini API key)")
        else:
            try:
                # Set environment variables for mem0
                os.environ['MEM0_API_KEY'] = mem0_api_key
                
                # Use working configuration: HuggingFace embeddings + Gemini LLM + correct vector dimensions
                from mem0.configs.base import MemoryConfig, EmbedderConfig, LlmConfig, VectorStoreConfig
                
                try:
                    # Configure HuggingFace embeddings (384 dimensions)
                    embedder_config = EmbedderConfig(
                        provider='huggingface',
                        config={
                            'model': 'sentence-transformers/all-MiniLM-L6-v2'
                        }
                    )
                    
                    # Configure Gemini LLM
                    llm_config = LlmConfig(
                        provider='gemini',
                        config={
                            'api_key': gemini_api_key,
                        }
                    )
                    
                    # Configure vector store with correct dimensions for HuggingFace model
                    # Use process-specific path or shared persistent path
                    db_path = os.path.expanduser("~/.memora/qdrant")
                    os.makedirs(db_path, exist_ok=True)
                    
                    vector_config = VectorStoreConfig(
                        provider='qdrant',
                        config={
                            'collection_name': 'memora_memories',
                            'embedding_model_dims': 384,  # Correct for all-MiniLM-L6-v2
                            'path': db_path,
                            'on_disk': True  # Persistent storage
                        }
                    )
                    
                    # Create complete memory config
                    memory_config = MemoryConfig(
                        embedder=embedder_config,
                        llm=llm_config,
                        vector_store=vector_config
                    )
                    
                    self.memory = Memory(config=memory_config)
                    self.config_used = "HuggingFace embeddings + Gemini LLM + Qdrant (384-dim)"
                    self.logger.info(f"MemoryService initialized successfully with {self.config_used}")
                    
                except Exception as e:
                    self.logger.error(f"Memory initialization failed: {e}")
                    # Try fallback with just HuggingFace embeddings and default LLM
                    try:
                        self.logger.info("Trying fallback configuration with HuggingFace embeddings only")
                        embedder_config = EmbedderConfig(
                            provider='huggingface',
                            config={'model': 'sentence-transformers/all-MiniLM-L6-v2'}
                        )
                        # Use same shared path for fallback
                        fallback_db_path = os.path.expanduser("~/.memora/qdrant_fallback")
                        os.makedirs(fallback_db_path, exist_ok=True)
                        
                        vector_config = VectorStoreConfig(
                            provider='qdrant',
                            config={
                                'collection_name': 'memora_fallback',
                                'embedding_model_dims': 384,
                                'path': fallback_db_path,
                                'on_disk': True  # Persistent storage
                            }
                        )
                        fallback_config = MemoryConfig(
                            embedder=embedder_config,
                            vector_store=vector_config
                        )
                        self.memory = Memory(config=fallback_config)
                        self.config_used = "Fallback: HuggingFace embeddings only"
                        self.logger.info("MemoryService initialized with fallback configuration")
                    except Exception as e2:
                        self.logger.error(f"Fallback initialization also failed: {e2}")
                        self.memory = None
                        self.logger.info("MemoryService initialized in no-memory mode")

            except Exception as e:
                self.logger.error(f"Critical error initializing mem0: {e}")
                self.memory = None
                self.logger.info("MemoryService initialized in fallback mode due to critical error")
    
    async def get_user_context(self, username: str) -> List[Dict[str, Any]]:
        """
        Retrieve conversation context for a specific user.
        
        Args:
            username: The username to get context for
            
        Returns:
            List of context dictionaries with role/content pairs
        """
        try:
            if not self.memory:
                self.logger.warning("mem0 client not available, returning empty context")
                return []
            
            # Get memories for this user
            self.logger.info(f"🔍 Retrieving memories for user: {username}")
            memories_response = self.memory.get_all(user_id=username)
            
            if not memories_response or 'results' not in memories_response:
                self.logger.info(f"📝 No memories found for user: {username}")
                return []
            
            memories = memories_response['results']
            self.logger.info(f"📚 Found {len(memories)} memories for user {username}")
            
            # Convert memories to context format
            context = []
            for memory in memories:
                if isinstance(memory, dict):
                    # Get memory content and metadata
                    memory_text = memory.get('memory', '')
                    metadata = memory.get('metadata', {})
                    
                    # Add user message if available in metadata
                    if 'user_message' in metadata:
                        context.append({"role": "user", "content": metadata['user_message']})
                    
                    # Add bot response if available in metadata
                    if 'bot_response' in metadata:
                        context.append({"role": "assistant", "content": metadata['bot_response']})
                    elif memory_text:
                        # Fall back to the memory text itself
                        context.append({"role": "assistant", "content": memory_text})
            
            # Limit context to last N conversations to manage token usage
            max_context_items = 20  # 10 user + 10 assistant messages
            return context[-max_context_items:]
            
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
            self.logger.info(f"💾 Storing interaction for user: {username}")
            result = self.memory.add(
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": bot_response}
                ],
                user_id=username,
                metadata=interaction_data
            )
            
            self.logger.info(f"✅ Stored interaction for {username}: {len(user_message)} chars message")
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
            memories_response = self.memory.get_all(user_id=username)
            
            if not memories_response or 'results' not in memories_response:
                return None
            
            memories = memories_response['results']
            
            if not memories:
                return None
            
            # Extract key information
            interaction_count = len(memories)
            recent_topics = []
            
            # Get last 3 memories
            recent_memories = memories[-3:] if len(memories) >= 3 else memories
            
            for memory in recent_memories:
                if isinstance(memory, dict):
                    # Try to get meaningful content
                    memory_text = memory.get('memory', '')
                    metadata = memory.get('metadata', {})
                    
                    # Prefer user message for topics
                    if 'user_message' in metadata:
                        content = metadata['user_message']
                    elif memory_text:
                        content = memory_text
                    else:
                        continue
                    
                    if content:
                        topic = content[:50] + "..." if len(content) > 50 else content
                        recent_topics.append(topic)
            
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
            
            # Get all memories for this user
            memories_response = self.memory.get_all(user_id=username)
            
            if not memories_response or 'results' not in memories_response:
                self.logger.info(f"No memories found for {username}")
                return True
            
            memories = memories_response['results']
            
            # Delete all memories for this user
            for memory in memories:
                if isinstance(memory, dict) and 'id' in memory:
                    self.memory.delete(memory_id=memory['id'])
            
            self.logger.info(f"Cleared {len(memories)} memories for {username}")
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