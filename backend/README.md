# Backend Setup Instructions

## Environment Setup

### 1. Install Dependencies

Make sure you're in the backend directory with the virtual environment activated:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables

Copy the `.env` file and fill in your actual credentials:

```bash
cp .env .env.local  # Optional: create local copy
```

Edit `.env` with your actual values:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_actual_api_key
LIVEKIT_API_SECRET=your_actual_secret

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# mem0.ai Configuration (Optional)
MEM0_API_KEY=your_mem0_key_here
```

### 3. Getting API Keys

#### LiveKit Cloud
1. Go to [LiveKit Cloud](https://cloud.livekit.io/)
2. Sign up/login and create a project
3. Get your API Key and Secret from the project settings
4. Use the WebSocket URL (wss://your-project.livekit.cloud)

#### Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. No credits needed - has generous free tier

#### mem0.ai (Optional)
1. Go to [mem0.ai](https://mem0.ai/)
2. Sign up and get your API key
3. This is optional - the agent will work without memory features

### 4. Running the Services

#### Option A: Run Agent Only
```bash
# Run the LiveKit agent
python agent.py
```

#### Option B: Run Token Server + Agent
```bash
# Terminal 1: Run token server (for frontend authentication)
python token_server.py

# Terminal 2: Run LiveKit agent
python agent.py
```

### 5. Testing

#### Test Token Server
```bash
curl -X POST http://localhost:3001/token \
  -H "Content-Type: application/json" \
  -d '{"room": "test-room", "identity": "test-user"}'
```

#### Test Agent Connection
The agent will automatically connect to LiveKit when started with proper credentials.

## Integration with Frontend

Update your frontend `.env.local` to point to the real LiveKit server and token endpoint:

```bash
# Frontend .env.local
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_TOKEN_SERVER_URL=http://localhost:3001
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure virtual environment is activated and dependencies installed
2. **Connection Errors**: Check LiveKit credentials and URL
3. **Token Errors**: Ensure token server is running and credentials match
4. **Memory Errors**: mem0.ai is optional, agent works without it

### Logs

The agent provides detailed logging. Check console output for connection status and errors.

### Development Mode

The frontend has a development mode that works without the Python backend. The Python backend enables:
- Real AI responses (vs simulated ones)
- Conversation memory across sessions
- Contextual responses based on history