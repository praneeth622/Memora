"""
Modern LiveKit Agent using AgentSession for AI-powered chat responses.
This agent uses text streams to handle chat messages, retrieves user context 
from memory, generates AI responses, and stores new interactions.

Following PROJECT_REFERENCE.md specifications and modern LiveKit agents patterns.
"""

import asyncio
import logging
import os
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli

from services.message_handler import MessageHandler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModernChatAgent(Agent):
    """
    Modern AI-powered chat agent using AgentSession pattern.
    
    This agent:
    1. Uses AgentSession for automatic text stream handling
    2. Receives text messages via lk.chat topic
    3. Processes messages through MessageHandler (AI + memory)
    4. Sends responses back via text output streams
    """
    
    def __init__(self):
        """Initialize the modern chat agent."""
        super().__init__(instructions="You are a helpful AI assistant with memory capabilities.")
        self.message_handler = MessageHandler()
        logger.info("🤖 Modern ChatAgent initialized with AgentSession")


async def handle_text_input(session: AgentSession, text: str, participant_identity: str = "User") -> None:
    """
    Handle user text input and generate AI response.
    
    Args:
        session: The AgentSession instance
        text: User's message text
        participant_identity: Identity of the participant who sent the message
    """
    try:
        logger.info(f"💬 Received text from {participant_identity}: {text}")
        
        # Create message handler instance
        message_handler = MessageHandler()
        
        # Process the message through AI + memory services
        ai_response = await message_handler.process_message(
            content=text,
            username=participant_identity
        )
        
        logger.info(f"🤖 Generated AI response: {ai_response[:50]}...")
        
        # Send response using AgentSession say method
        await session.say(ai_response)
        
    except Exception as e:
        logger.error(f"❌ Error handling text input: {e}")
        await session.say("Sorry, I encountered an error processing your message. Please try again.")


async def entrypoint(ctx: JobContext):
    """
    Modern entrypoint using AgentSession for automatic text stream handling.
    
    Args:
        ctx: JobContext from LiveKit containing room information
    """
    logger.info(f"🚀 Modern Agent starting, connecting to room: {ctx.room.name}")
    
    # Connect to the room first
    await ctx.connect()
    logger.info(f"✅ Connected to room: {ctx.room.name}")
    
    # Create AgentSession with text input/output enabled
    session = AgentSession()
    
    # Create the agent instance
    agent = ModernChatAgent()
    
    # Custom text input callback to handle user messages
    async def text_input_callback(session: AgentSession, ev) -> None:
        """Handle text input events from users."""
        participant_identity = ev.participant.identity if ev.participant else "User"
        await handle_text_input(session, ev.text, participant_identity)
    
    # Start the session with custom input options
    input_options = RoomInputOptions(
        text_enabled=True,
        audio_enabled=False,  # Text-only agent
        video_enabled=False,
        text_input_cb=text_input_callback
    )
    
    output_options = RoomOutputOptions(
        audio_enabled=False,  # Text-only responses
        transcription_enabled=True  # Enable text output
    )
    
    await session.start(
        room=ctx.room,
        agent=agent,
        input_options=input_options,
        output_options=output_options
    )
    
    # Send welcome message
    await session.say("👋 AI Assistant has joined the room and is ready to help!")
    
    logger.info("🎉 Modern Agent session started successfully!")
    
    # Keep the session running
    await session.wait_for_close()


def prewarm(proc):
    """
    Prewarm function called before the agent starts.
    Used to initialize resources that can be shared across job instances.
    
    Args:
        proc: JobProcess from LiveKit
    """
    logger.info("🔥 Prewarming Modern ChatAgent...")


if __name__ == "__main__":
    # Run the agent using LiveKit CLI
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )