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
        
    def sync_handle_data_received(self, *args, **kwargs):
        try:
            logger.info(f"Data received callback called with args: {len(args)}, types: {[type(arg) for arg in args]}")
            logger.info(f"Data received callback called with kwargs: {kwargs}")
            
            # Try to extract the data and participant from the arguments
            if len(args) >= 1:
                data = args[0]
                participant = args[1] if len(args) >= 2 else None
                
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                loop.create_task(self.handle_data_received(data, participant, ""))
            else:
                logger.error("No arguments received in data_received callback")
        except Exception as e:
            logger.error(f"Error in sync data handler: {e}")
            logger.error(f"Parameters received: args={args}, kwargs={kwargs}")
    
    async def handle_data_received(self, data: bytes, participant: rtc.RemoteParticipant = None, topic: str = ""):
        try:
            text_data = data.decode('utf-8')
            participant_id = participant.identity if participant else "Unknown"
            logger.info(f"Received data from {participant_id}: {text_data}")
            
            try:
                message_data = json.loads(text_data)
                message_text = message_data.get('message', text_data)
                message_type = message_data.get('type', 'chat')
                
                if message_type == 'chat':
                    await self.process_chat_message(message_text, participant_id)
            except json.JSONDecodeError:
                await self.process_chat_message(text_data, participant_id)
                
        except Exception as e:
            logger.error(f"Error handling data received: {e}")
    
    async def process_chat_message(self, message: str, username: str):
        try:
            logger.info(f"Processing chat message from {username}: {message}")
            response = await self.message_handler.process_message(message, username)
            logger.info(f"Generated AI response: {response}")
            await self.send_response(response, username)
        except Exception as e:
            logger.error(f"Error processing chat message: {e}")
            await self.send_response("I encountered an error. Please try again.", username)
    
    async def send_response(self, response: str, original_sender: str):
        try:
            if not self.room:
                logger.error("Cannot send response: no room connection")
                return
                
            response_data = {
                "type": "ai_response",
                "message": response,
                "from": "AI Assistant",
                "in_reply_to": original_sender,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            response_json = json.dumps(response_data)
            await self.room.local_participant.publish_data(response_json.encode('utf-8'), reliable=True)
            logger.info(f"Sent AI response to room (reply to {original_sender})")
        except Exception as e:
            logger.error(f"Error sending response: {e}")
    
    async def entrypoint(self, ctx: JobContext):
        try:
            logger.info(f"Connecting to room: {ctx.room.name}")
            await ctx.connect()
            self.room = ctx.room
            logger.info(f"Connected to room: {ctx.room.name}")
            
            ctx.room.on("data_received", lambda *args, **kwargs: self.sync_handle_data_received(*args, **kwargs))
            ctx.room.on("participant_connected", self.on_participant_connected)
            ctx.room.on("participant_disconnected", self.on_participant_disconnected)
            
            logger.info("Event handlers registered")
            logger.info("ChatAgent ready to receive messages!")
        except Exception as e:
            logger.error(f"Error in agent entrypoint: {e}")
            raise
    
    def on_participant_connected(self, participant: rtc.RemoteParticipant):
        logger.info(f"Participant joined: {participant.identity}")
    
    def on_participant_disconnected(self, participant: rtc.RemoteParticipant):
        logger.info(f"Participant left: {participant.identity}")

async def entrypoint(ctx: JobContext):
    logger.info("Starting ChatAgent...")
    agent = ChatAgent()
    await agent.entrypoint(ctx)

def prewarm(proc):
    logger.info("Prewarming ChatAgent...")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
