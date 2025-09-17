"""
Modern agent implementation using AgentSession pattern for better LiveKit integration.
This approach should automatically handle room connections and message processing.
"""

import asyncio
import logging
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli
from livekit import agents, rtc
from services.message_handler import MessageHandler

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModernChatAgent:
    """Modern AI-powered chat agent using LiveKit agents framework."""
    
    def __init__(self):
        self.message_handler = MessageHandler()
        logger.info("ModernChatAgent initialized")

async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for the LiveKit agent using modern pattern.
    This should automatically handle room connections and be triggered by LiveKit Cloud.
    
    Args:
        ctx: JobContext from LiveKit containing room information
    """
    logger.info(f"🚀 Modern Agent entrypoint called for room: {ctx.room.name if ctx.room else 'Unknown'}")
    
    try:
        # Connect to the room
        await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
        logger.info(f"✅ Connected to room: {ctx.room.name}")
        
        # Create the agent instance
        agent = ModernChatAgent()
        
        # Set up event handlers for the room
        @ctx.room.on("data_received")
        def on_data_received(data: rtc.DataPacket, participant: rtc.RemoteParticipant = None):
            """Handle incoming data messages."""
            logger.info(f"📨 Data received from {participant.identity if participant else 'Unknown'}")
            
            try:
                # Decode the message
                message_text = data.data.decode('utf-8')
                participant_id = participant.identity if participant else "Unknown"
                
                logger.info(f"Message: '{message_text}' from {participant_id}")
                
                # Process the message asynchronously
                asyncio.create_task(process_message_async(message_text, participant_id, ctx.room))
                
            except Exception as e:
                logger.error(f"Error processing data: {e}")
        
        @ctx.room.on("participant_connected") 
        def on_participant_connected(participant: rtc.RemoteParticipant):
            """Handle new participant joining."""
            logger.info(f"👤 Participant joined: {participant.identity}")
            
            # Send welcome message
            welcome_msg = f"Welcome {participant.identity}! I'm an AI assistant ready to help."
            asyncio.create_task(send_response(welcome_msg, ctx.room))
        
        @ctx.room.on("participant_disconnected")
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            """Handle participant leaving.""" 
            logger.info(f"👋 Participant left: {participant.identity}")
        
        logger.info("🎯 Event handlers registered, agent ready!")
        
        # Keep the agent running
        while ctx.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
            
        logger.info("🔌 Room disconnected, agent stopping")
        
    except Exception as e:
        logger.error(f"❌ Error in agent entrypoint: {e}")
        raise

async def process_message_async(message: str, username: str, room: rtc.Room):
    """Process user message and generate AI response."""
    try:
        logger.info(f"🔄 Processing message from {username}: {message}")
        
        # Create message handler instance
        message_handler = MessageHandler()
        
        # Generate AI response
        response = await message_handler.handle_message(message, username)
        
        logger.info(f"🤖 Generated response: {response}")
        
        # Send response back to room
        await send_response(response, room)
        
    except Exception as e:
        logger.error(f"❌ Error processing message: {e}")
        
        # Send fallback response
        fallback_msg = "Sorry, I encountered an error processing your message. Please try again."
        await send_response(fallback_msg, room)

async def send_response(message: str, room: rtc.Room):
    """Send a message response to the room."""
    try:
        logger.info(f"📤 Sending response to room: {message}")
        
        # Send message as data packet
        await room.local_participant.publish_data(
            message.encode('utf-8'),
            reliable=True
        )
        
        logger.info("✅ Response sent successfully")
        
    except Exception as e:
        logger.error(f"❌ Error sending response: {e}")

def prewarm(proc):
    """Prewarm the agent process."""
    logger.info("🔥 Prewarming ModernChatAgent...")

if __name__ == "__main__":
    logger.info("🚀 Starting Modern LiveKit Agent...")
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm
        )
    )