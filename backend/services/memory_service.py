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
        
        # Use shared database path but handle locking gracefully
        self.db_path = os.path.expanduser("~/.memora/qdrant_shared")
        os.makedirs(self.db_path, exist_ok=True)
        
        # Get API keys from environment
        mem0_api_key = os.getenv('MEM0_API_KEY')
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        # Initialize simple file-based memory as primary fallback
        self.simple_memory_path = os.path.expanduser("~/.memora/simple_memory.json")
        os.makedirs(os.path.dirname(self.simple_memory_path), exist_ok=True)
        
        if not mem0_api_key:
            self.logger.warning("MEM0_API_KEY not found - using simple file-based memory")
            self.memory = None
            self.config_used = "Simple file-based memory"
            self.logger.info("MemoryService initialized with simple file-based fallback")
        elif not gemini_api_key:
            self.logger.warning("GEMINI_API_KEY not found - using simple file-based memory")
            self.memory = None
            self.config_used = "Simple file-based memory"
            self.logger.info("MemoryService initialized with simple file-based fallback")
        else:
            try:
                # Set environment variables for mem0
                os.environ['MEM0_API_KEY'] = mem0_api_key
                
                # Use working configuration: HuggingFace embeddings + Gemini LLM + correct vector dimensions
                from mem0.configs.base import MemoryConfig, EmbedderConfig, LlmConfig, VectorStoreConfig
                
                try:
                    # Try using mem0's default configuration first (uses their cloud service)
                    self.memory = Memory()
                    self.config_used = "mem0 cloud service (default)"
                    self.logger.info(f"MemoryService initialized with mem0 cloud service")
                    
                except Exception as e:
                    self.logger.error(f"Memory initialization failed: {e}")
                    # Try fallback with mem0's default configuration (simpler setup)
                    try:
                        self.logger.info("Trying simple mem0 initialization with API key only")
                        self.memory = Memory()
                        self.config_used = "Simple mem0 with API key"
                        self.logger.info("MemoryService initialized with simple mem0 configuration")
                    except Exception as e2:
                        self.logger.error(f"Simple mem0 initialization also failed: {e2}")
                        # Final fallback: use local configuration with Gemini LLM (no OpenAI required)
                        try:
                            self.logger.info("Trying final fallback with Gemini LLM + HuggingFace embeddings")
                            # Use fallback local database 
                            fallback_db_path = os.path.expanduser("~/.memora/qdrant_fallback")
                            os.makedirs(fallback_db_path, exist_ok=True)
                            self._cleanup_qdrant_locks(fallback_db_path)
                            
                            # Use Gemini for LLM (we have the API key) and HuggingFace for embeddings
                            embedder_config = EmbedderConfig(
                                provider='huggingface',
                                config={'model': 'sentence-transformers/all-MiniLM-L6-v2'}
                            )
                            
                            llm_config = LlmConfig(
                                provider='gemini',
                                config={
                                    'api_key': gemini_api_key,
                                }
                            )
                            
                            vector_config = VectorStoreConfig(
                                provider='qdrant',
                                config={
                                    'collection_name': 'memora_fallback',
                                    'embedding_model_dims': 384,
                                    'path': fallback_db_path,
                                    'on_disk': True
                                }
                            )
                            
                            fallback_config = MemoryConfig(
                                embedder=embedder_config,
                                llm=llm_config,
                                vector_store=vector_config
                            )
                            self.memory = Memory(config=fallback_config)
                            self.config_used = "Fallback: HuggingFace embeddings + Gemini LLM + local Qdrant"
                            self.logger.info("MemoryService initialized with fallback configuration")
                        except Exception as e3:
                            self.logger.error(f"All mem0 attempts failed: {e3}")
                            self.logger.info("Falling back to simple file-based memory")
                            self.memory = None
                            self.config_used = "Simple file-based memory"

            except Exception as e:
                self.logger.error(f"Critical error initializing mem0: {e}")
                self.logger.info("Using simple file-based memory fallback")
                self.memory = None
                self.config_used = "Simple file-based memory"
    
    def _cleanup_qdrant_locks(self, db_path: str):
        """Clean up any Qdrant lock files that might prevent access."""
        try:
            import glob
            lock_files = glob.glob(os.path.join(db_path, "*.lock"))
            lock_files.extend(glob.glob(os.path.join(db_path, "*/*.lock")))
            
            for lock_file in lock_files:
                try:
                    os.remove(lock_file)
                    self.logger.info(f"Removed lock file: {lock_file}")
                except Exception as e:
                    self.logger.debug(f"Could not remove lock file {lock_file}: {e}")
        except Exception as e:
            self.logger.debug(f"Lock cleanup failed (non-critical): {e}")
    
    def _load_simple_memory(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load simple file-based memory."""
        try:
            if os.path.exists(self.simple_memory_path):
                with open(self.simple_memory_path, 'r') as f:
                    import json
                    return json.load(f)
            return {}
        except Exception as e:
            self.logger.error(f"Error loading simple memory: {e}")
            return {}
    
    def _save_simple_memory(self, memory_data: Dict[str, List[Dict[str, Any]]]) -> bool:
        """Save simple file-based memory."""
        try:
            with open(self.simple_memory_path, 'w') as f:
                import json
                json.dump(memory_data, f, indent=2, default=str)
            return True
        except Exception as e:
            self.logger.error(f"Error saving simple memory: {e}")
            return False
    
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
                # Use simple memory fallback
                self.logger.info(f"🔍 Retrieving simple memory for user: {username}")
                memory_data = self._load_simple_memory()
                user_conversations = memory_data.get(username, [])
                
                # Convert to context format
                context = []
                for conversation in user_conversations:
                    context.append({"role": "user", "content": conversation['user_message']})
                    context.append({"role": "assistant", "content": conversation['bot_response']})
                
                # Limit context to last N conversations
                max_context_items = 20
                context = context[-max_context_items:]
                self.logger.info(f"📚 Retrieved {len(context)} context items from simple memory for {username}")
                return context
            
            # Use mem0 if available
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
                # Use simple memory fallback
                self.logger.info(f"💾 Storing interaction in simple memory for user: {username}")
                memory_data = self._load_simple_memory()
                
                if username not in memory_data:
                    memory_data[username] = []
                
                # Add new interaction
                interaction = {
                    "user_message": user_message,
                    "bot_response": bot_response,
                    "timestamp": datetime.now().isoformat(),
                    "conversation_type": "chat_room"
                }
                
                memory_data[username].append(interaction)
                
                # Keep only last 50 interactions per user to manage file size
                memory_data[username] = memory_data[username][-50:]
                
                success = self._save_simple_memory(memory_data)
                if success:
                    self.logger.info(f"✅ Stored interaction in simple memory for {username}")
                return success
            
            # Use mem0 if available
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