"""
Simple token server for generating LiveKit access tokens.
This server provides JWT tokens for the frontend to authenticate with LiveKit.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from livekit.api import AccessToken, VideoGrants
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# LiveKit configuration
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')

@app.route('/token', methods=['POST'])
def generate_token():
    """
    Generate a LiveKit access token for room access.
    
    Expected JSON payload:
    {
        "room": "room-name",
        "identity": "user-identity"
    }
    """
    try:
        # Validate environment variables
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            return jsonify({
                'error': 'Server configuration error: Missing LiveKit credentials'
            }), 500
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        room = data.get('room')
        identity = data.get('identity')
        
        if not room or not identity:
            return jsonify({
                'error': 'Missing required fields: room and identity'
            }), 400
        
        # Create access token
        token = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token = token.with_identity(identity).with_grants(VideoGrants(
            room_join=True,
            room=room,
        ))
        
        # Generate JWT
        jwt_token = token.to_jwt()
        
        logger.info(f"Generated token for user '{identity}' in room '{room}'")
        
        return jsonify({
            'token': jwt_token,
            'room': room,
            'identity': identity
        })
        
    except Exception as e:
        logger.error(f"Error generating token: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'livekit-token-server'
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with usage information."""
    return jsonify({
        'message': 'LiveKit Token Server',
        'endpoints': {
            '/token': 'POST - Generate access token',
            '/health': 'GET - Health check'
        },
        'usage': {
            'token_generation': {
                'method': 'POST',
                'url': '/token',
                'body': {
                    'room': 'room-name',
                    'identity': 'user-identity'
                }
            }
        }
    })

if __name__ == '__main__':
    # Validate configuration
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        logger.error("Missing required environment variables: LIVEKIT_API_KEY, LIVEKIT_API_SECRET")
        exit(1)
    
    logger.info("Starting LiveKit token server...")
    logger.info(f"LiveKit API Key: {'✅' if LIVEKIT_API_KEY else '❌'}")
    logger.info(f"LiveKit API Secret: {'✅' if LIVEKIT_API_SECRET else '❌'}")
    
    # Run the server
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 3001)),
        debug=os.getenv('ENVIRONMENT') == 'development'
    )