import asyncio
import json
import logging
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli
from services.message_handler import MessageHandler

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatAgent:
    def __init__(self):
        self.message_handler = MessageHandler()
        self.room = None
        logger.info("ChatAgent initialized")
        
    def handle_data_received_simple(self, data_packet):
        """Simple test handler to understand the data packet structure"""
        try:
            logger.info(f"📨 SIMPLE: Data received, type: {type(data_packet)}")
            
            # Log all attributes of the data packet
            if hasattr(data_packet, '__dict__'):
                attrs = list(data_packet.__dict__.keys())
                logger.info(f"📦 DataPacket attributes: {attrs}")
                
                # Try to access common attributes
                if hasattr(data_packet, 'data'):
                    logger.info(f"📦 Data length: {len(data_packet.data)} bytes")
                if hasattr(data_packet, 'participant'):
                    logger.info(f"📦 Participant: {data_packet.participant}")
                if hasattr(data_packet, 'participant_identity'):
                    logger.info(f"📦 Participant identity: {data_packet.participant_identity}")
                if hasattr(data_packet, 'payload'):
                    logger.info(f"📦 Payload: {data_packet.payload}")
                    
            # Try to process the data with fallback participant
            if hasattr(data_packet, 'data'):
                payload = data_packet.data
                participant = None
                
                # Get any available participant
                if self.room and len(self.room.remote_participants) > 0:
                    participant = list(self.room.remote_participants.values())[0]
                    logger.info(f"✅ Using participant: {participant.identity}")
                    
                    # Process the message
                    asyncio.create_task(self.handle_data_received_async(payload, participant))
                else:
                    logger.error(f"❌ No participants available in room")
            else:
                logger.error(f"❌ No data attribute found in packet")
                
        except Exception as e:
            logger.error(f"❌ Error in simple handler: {e}")
            import traceback
            logger.error(f"📦 Traceback: {traceback.format_exc()}")
    
    def handle_data_received_wrapper(self, *args, **kwargs):
        """Flexible wrapper for LiveKit data received events"""
        try:
            logger.info(f"📨 Data received - Args: {len(args)}, Arg types: {[type(arg) for arg in args]}")
            
            # LiveKit passes arguments in different formats depending on SDK version
            if len(args) >= 1:
                data_arg = args[0]  # This could be payload or DataPacket
                
                # Try to extract payload and participant from args
                payload = None
                participant = None
                
                if len(args) >= 2:
                    participant_arg = args[1]
                    if hasattr(participant_arg, 'identity'):
                        participant = participant_arg
                        
                # Try to determine payload format
                if isinstance(data_arg, bytes):
                    payload = data_arg
                elif hasattr(data_arg, 'data'):
                    payload = data_arg.data
                else:
                    payload = str(data_arg).encode('utf-8')
                
                if payload and participant:
                    logger.info(f"� Processing data from {participant.identity}: {len(payload)} bytes")
                    
                    # Create async task
                    try:
                        loop = asyncio.get_event_loop()
                    except RuntimeError:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                    
                    loop.create_task(self.handle_data_received_async(payload, participant))
                else:
                    logger.error(f"❌ Could not extract payload or participant from args")
                    
            else:
                logger.error(f"❌ No arguments received in data handler")
                
        except Exception as e:
            logger.error(f"❌ Error in data received wrapper: {e}")
            logger.error(f"📦 Args: {args}, Kwargs: {kwargs}")
    
    async def handle_data_received_async(self, payload: bytes, participant: rtc.RemoteParticipant):
        """Async handler for processing data packets from participants"""
        try:
            # Decode the payload
            text_data = payload.decode('utf-8')
            participant_id = participant.identity
            
            logger.info(f"📥 Processing data from {participant_id}: {text_data}")
            
            try:
                message_data = json.loads(text_data)
                # Support both 'content' and 'message' field names for compatibility
                message_text = message_data.get('content') or message_data.get('message', text_data)
                message_type = message_data.get('type', 'chat')
                
                if message_type == 'chat-message' or message_type == 'chat':
                    logger.info(f"🔄 Processing chat message from {participant_id}: {message_text}")
                    await self.process_chat_message(message_text, participant_id)
                else:
                    logger.info(f"ℹ️ Ignoring message type: {message_type}")
            except json.JSONDecodeError:
                logger.info(f"🔄 Processing plain text from {participant_id}: {text_data}")
                await self.process_chat_message(text_data, participant_id)
                
        except Exception as e:
            logger.error(f"❌ Error in async data handler: {e}")
            logger.error(f"📦 Payload: {payload}")
            logger.error(f"👤 Participant: {participant}")
    
    async def process_chat_message(self, message: str, username: str):
        try:
            logger.info(f"🔄 Processing chat message from {username}: {message}")
            
            # Use the message handler to process with AI and memory
            response = await self.message_handler.process_message(message, username)
            
            logger.info(f"🤖 Generated AI response: {response[:100]}...")
            await self.send_response(response, username)
            
        except Exception as e:
            logger.error(f"❌ Error processing chat message: {e}")
            # Send a helpful error message
            error_response = "I'm having trouble processing your message right now. Please try asking again!"
            await self.send_response(error_response, username)
    
    async def send_response(self, response: str, original_sender: str):
        try:
            if not self.room:
                logger.error("Cannot send response: no room connection")
                return
                
            response_data = {
                "type": "chat-message",
                "content": response,
                "sender": "AI Assistant", 
                "timestamp": int(asyncio.get_event_loop().time() * 1000)  # Convert to milliseconds
            }
            
            response_json = json.dumps(response_data)
            logger.info(f"📤 Sending response data: {response_json}")
            await self.room.local_participant.publish_data(response_json.encode('utf-8'), reliable=True)
            logger.info(f"Sent AI response to room (reply to {original_sender})")
        except Exception as e:
            logger.error(f"Error sending response: {e}")
    
    async def entrypoint(self, ctx: JobContext):
        try:
            logger.info(f"🚀 Agent dispatched to room: {ctx.room.name or 'Unknown'}")
            logger.info(f"🔗 Connecting to LiveKit room...")
            
            # Connect to the room with auto-subscribe enabled
            await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
            self.room = ctx.room
            
            logger.info(f"✅ Successfully connected to room: {ctx.room.name}")
            logger.info(f"📊 Room participants: {len(ctx.room.remote_participants)}")
            
            # Register event handlers with better error handling
            ctx.room.on("data_received", self.handle_data_received_simple)
            ctx.room.on("participant_connected", self.on_participant_connected)
            ctx.room.on("participant_disconnected", self.on_participant_disconnected)
            
            logger.info("🎯 Event handlers registered successfully")
            logger.info("🤖 ChatAgent is ready and listening for messages!")
            
            # Send a welcome message to the room if there are participants
            if len(ctx.room.remote_participants) > 0:
                await self.send_welcome_message()
                
        except Exception as e:
            logger.error(f"❌ Error in agent entrypoint: {e}")
            logger.error(f"Room info: {ctx.room.name if ctx.room else 'No room'}")
            raise
    
    def on_participant_connected(self, participant: rtc.RemoteParticipant):
        logger.info(f"👤 Participant joined: {participant.identity}")
        # Send welcome message to new participant
        asyncio.create_task(self.send_welcome_message_to_participant(participant.identity))
    
    def on_participant_disconnected(self, participant: rtc.RemoteParticipant):
        logger.info(f"👋 Participant left: {participant.identity}")
    
    async def send_welcome_message(self):
        """Send a welcome message when agent first joins the room."""
        welcome_msg = "🤖 AI Assistant has joined the chat! Feel free to ask me anything."
        await self.send_response(welcome_msg, "system")
    
    async def send_welcome_message_to_participant(self, participant_identity: str):
        """Send a personalized welcome message to a specific participant."""
        welcome_msg = f"👋 Welcome {participant_identity}! I'm your AI Assistant. How can I help you today?"
        await self.send_response(welcome_msg, participant_identity)

async def entrypoint(ctx: JobContext):
    logger.info("Starting ChatAgent...")
    agent = ChatAgent()
    await agent.entrypoint(ctx)

def prewarm(proc):
    logger.info("Prewarming ChatAgent...")

if __name__ == "__main__":
    # Enable automatic dispatch by NOT setting agent_name
    # This allows the agent to automatically join new rooms
    worker_options = WorkerOptions(
        entrypoint_fnc=entrypoint, 
        prewarm_fnc=prewarm
        # NOTE: No agent_name set - this enables automatic dispatch to all rooms
    )
    logger.info("Starting LiveKit agent with automatic dispatch enabled...")
    cli.run_app(worker_options)
