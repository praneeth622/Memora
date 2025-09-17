#!/usr/bin/env python3
"""
Test script to trigger agent by sending messages to a LiveKit room.
This helps verify if the agent responds to data messages.
"""

import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit import rtc, api

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LiveKit configuration
LIVEKIT_URL = os.getenv('LIVEKIT_URL')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')

async def test_agent_trigger():
    """Connect to room and send test message to trigger agent."""
    try:
        # Generate token for test user
        from livekit.api import AccessToken, VideoGrants
        
        token = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token = token.with_identity("TestTrigger").with_grants(VideoGrants(
            room_join=True,
            room="test-room",
        ))
        jwt_token = token.to_jwt()
        
        # Connect to room
        logger.info("Connecting to LiveKit room...")
        room = rtc.Room()
        
        @room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant connected: {participant.identity}")
        
        @room.on("data_received") 
        def on_data_received(data: rtc.DataPacket, participant: rtc.RemoteParticipant = None):
            logger.info(f"Data received from {participant.identity if participant else 'Unknown'}: {data.data.decode()}")
        
        # Connect to the room
        await room.connect(LIVEKIT_URL, jwt_token)
        logger.info(f"Connected to room: test-room")
        
        # Wait a moment for connection to stabilize
        await asyncio.sleep(2)
        
        # Send test message
        test_message = "Hello agent, please respond!"
        logger.info(f"Sending test message: {test_message}")
        
        await room.local_participant.publish_data(
            test_message.encode('utf-8'),
            reliable=True
        )
        
        logger.info("Message sent, waiting for agent response...")
        
        # Keep connection open for a while to see responses
        await asyncio.sleep(10)
        
        await room.disconnect()
        logger.info("Disconnected from room")
        
    except Exception as e:
        logger.error(f"Error in test: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_agent_trigger())