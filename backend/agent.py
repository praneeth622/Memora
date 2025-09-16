"""
LiveKit Agent that joins rooms and provides AI-powered chat responses.
This agent listens for messages, retrieves user context from memory, 
generates AI responses, and stores new interactions.

Following PROJECT_REFERENCE.md specifications for ChatAgent class structure.
"""

import asyncio
import logging
import json
import os
from typing import Optional
from dotenv import load_dotenv

from livekit.agents import JobContext, WorkerOptions, cli
from livekit import rtc

from services.message_handler import MessageHandler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatAgent:
    """
    AI-powered chat agent that joins LiveKit rooms and responds to messages.
    
    This agent:
    1. Joins LiveKit rooms as a bot participant
    2. Listens for data messages from users
    3. Processes messages through MessageHandler (AI + memory)
    4. Sends AI-generated responses back to the room
    """
    
    def __init__(self):
        """Initialize the chat agent with message handler."""
        self.message_handler = MessageHandler()
        self.room = None  # Store room reference for event handlers
        logger.info("🤖 ChatAgent initialized")
    
    async def entrypoint(self, ctx: JobContext):
        """
        Main entry point for the agent when it joins a room.
        
        Args:
            ctx: JobContext from LiveKit containing room information
        """
        logger.info(f"🚀 Agent starting, connecting to room: {ctx.room.name}")
        
        # Connect to the room
        await ctx.connect()
        
        # Store room reference for use in event handlers
        self.room = ctx.room
        
        # Set up event handlers (sync wrappers for async handlers)
        def sync_handle_data_received(data, participant):
            asyncio.create_task(self._handle_data_received(data, participant))
            
        def sync_handle_participant_connected(participant):
            asyncio.create_task(self._handle_participant_connected(participant))
            
        def sync_handle_participant_disconnected(participant):
            asyncio.create_task(self._handle_participant_disconnected(participant))
        
        ctx.room.on("data_received", sync_handle_data_received)
        ctx.room.on("participant_connected", sync_handle_participant_connected)
        ctx.room.on("participant_disconnected", sync_handle_participant_disconnected)
        
        logger.info(f"✅ Agent connected to room: {ctx.room.name}")
        
        # Send a welcome message to the room
        welcome_message = {
            "type": "chat",
            "message": "👋 AI Assistant has joined the room and is ready to help!",
            "sender": "AI-Assistant",
            "timestamp": asyncio.get_event_loop().time()
        }
        
        await ctx.room.local_participant.publish_data(
            json.dumps(welcome_message).encode(),
            reliable=True
        )
        
        # Keep the agent running
        await asyncio.sleep(float('inf'))
    
    async def _handle_data_received(self, data: bytes, participant: Optional[rtc.RemoteParticipant] = None):
        """
        Handle incoming data messages from participants.
        
        Args:
            data: Raw message data from participant
            participant: The participant who sent the message (optional)
        """
        try:
            # Decode the message
            message_str = data.decode('utf-8')
            message_data = json.loads(message_str)
            
            # Extract message details
            message_type = message_data.get('type', '')
            message_content = message_data.get('message', '')
            sender_name = message_data.get('sender', 'Unknown')
            
            # Only process chat messages
            if message_type != 'chat' or not message_content:
                return
            
            # Skip messages from the AI assistant itself
            if sender_name == 'AI-Assistant':
                return
            
            logger.info(f"💬 Received message from {sender_name}: {message_content}")
            
            # Process the message through AI + memory services
            ai_response = await self.message_handler.process_message(
                content=message_content,
                username=sender_name
            )
            
            # Prepare response message
            response_data = {
                "type": "chat",
                "message": ai_response,
                "sender": "AI-Assistant",
                "timestamp": asyncio.get_event_loop().time()
            }
            
            # Send response back to room (using stored room reference)
            if participant and self.room:
                await self.room.local_participant.publish_data(
                    json.dumps(response_data).encode(),
                    reliable=True
                )
            
            logger.info(f"🤖 AI response sent: {ai_response[:50]}...")
            
        except json.JSONDecodeError:
            logger.error(f"❌ Failed to decode JSON message: {data}")
        except Exception as e:
            logger.error(f"❌ Error processing message: {e}")
            
            # Send error response
            try:
                error_response = {
                    "type": "chat",
                    "message": "Sorry, I encountered an error processing your message. Please try again.",
                    "sender": "AI-Assistant",
                    "timestamp": asyncio.get_event_loop().time()
                }
                
                if participant and self.room:
                    await self.room.local_participant.publish_data(
                        json.dumps(error_response).encode(),
                        reliable=True
                    )
            except Exception as send_error:
                logger.error(f"❌ Failed to send error response: {send_error}")
    
    async def _handle_participant_connected(self, participant: rtc.RemoteParticipant):
        """
        Handle when a participant joins the room.
        
        Args:
            participant: The participant who joined
        """
        logger.info(f"👤 Participant joined: {participant.identity}")
        
        # Send a personalized greeting
        try:
            greeting_message = {
                "type": "chat",
                "message": f"Welcome to the chat, {participant.identity}! I'm your AI assistant. Feel free to ask me anything!",
                "sender": "AI-Assistant",
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await self.room.local_participant.publish_data(
                json.dumps(greeting_message).encode(),
                reliable=True
            )
        except Exception as e:
            logger.error(f"❌ Failed to send greeting message: {e}")
    
    async def _handle_participant_disconnected(self, participant: rtc.RemoteParticipant):
        """
        Handle when a participant leaves the room.
        
        Args:
            participant: The participant who left
        """
        logger.info(f"👋 Participant left: {participant.identity}")

async def entrypoint(ctx: JobContext):
    """
    Entry point function for the LiveKit agent.
    
    Args:
        ctx: JobContext provided by LiveKit agents framework
    """
    logger.info("🚀 Starting ChatAgent...")
    agent = ChatAgent()
    await agent.entrypoint(ctx)

def prewarm(proc):
    """
    Prewarm function called before the agent starts.
    Used to initialize resources that can be shared across job instances.
    
    Args:
        proc: JobProcess from LiveKit
    """
    logger.info("🔥 Prewarming ChatAgent...")

if __name__ == "__main__":
    # Run the agent using LiveKit CLI
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )