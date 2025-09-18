# Memora AI Chat Agent 🤖💬

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-00D4AA?style=flat&logo=livekit&logoColor=white)](https://livekit.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A sophisticated real-time AI chat agent built with modern web technologies, featuring contextual memory, multi-user support, and seamless WebRTC communication.

## 🌟 Project Overview

Memora is an intelligent conversational AI platform that combines the power of real-time communication with advanced memory capabilities. Built on a microservices architecture, it provides users with contextual, personalized chat experiences while maintaining conversation history and user-specific memory isolation.

The system leverages LiveKit's WebRTC infrastructure for ultra-low latency messaging, Gemini AI for intelligent responses, and mem0.ai for sophisticated memory management, creating a seamless and intelligent conversational experience.

## ✨ Key Features

### 🎯 Core Capabilities
- **Real-time Messaging**: Instant bi-directional communication using WebRTC data channels
- **AI-Powered Responses**: Context-aware conversations powered by Google's Gemini AI
- **Persistent Memory**: Conversation context and user preferences stored using mem0.ai
- **Multi-user Support**: Isolated memory and conversation spaces for multiple users
- **Room-based Chat**: Dynamic room creation with unique identifiers
- **Connection Resilience**: Automatic reconnection and error recovery mechanisms

### 🧠 Intelligence Features
- **Contextual Understanding**: AI maintains conversation context across sessions
- **User Identity Recognition**: Personalized responses based on user history
- **Memory Isolation**: Secure separation of user data and conversation history
- **Fact Extraction**: Automatic extraction and storage of important conversation facts
- **Semantic Search**: Vector-based memory retrieval for relevant context

### 🔧 Technical Features
- **Modular Architecture**: Clean separation of concerns with service-oriented design
- **TypeScript Frontend**: Type-safe development with modern React patterns
- **Python Backend**: Scalable microservices with async/await patterns
- **WebRTC Integration**: Direct peer-to-peer communication for minimal latency
- **Responsive Design**: Mobile-first UI with dark/light theme support
- **Real-time Status**: Live connection indicators and participant management

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: LiveKit WebRTC SDK
- **State Management**: React Hooks + Context API
- **UI Components**: Radix UI primitives

### Backend
- **Runtime**: Python 3.13+
- **Framework**: LiveKit Agents SDK
- **AI Service**: Google Gemini AI API
- **Memory Store**: mem0.ai with Qdrant vector database
- **Embeddings**: HuggingFace sentence-transformers
- **Token Server**: Flask for JWT token generation
- **Architecture**: Microservices with dependency injection

### Infrastructure
- **Communication**: LiveKit Cloud WebRTC
- **Vector Database**: Qdrant (local/cloud)
- **Environment**: Docker-ready with environment configuration
- **Development**: Hot reloading with file watching

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   LiveKit Cloud  │    │   Backend       │
│   (Next.js)     │◄──►│   WebRTC Relay   │◄──►│   (Python)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐             │
         │              │ Data Channels   │             │
         │              │ (Messaging)     │             │
         │              └─────────────────┘             │
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│ Token Server    │                          │ AI Services     │
│ (Flask:3003)    │                          │ ├── Gemini API  │
└─────────────────┘                          │ ├── Memory      │
                                             │ └── Message     │
                                             └─────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Memory Store    │
                                             │ (mem0.ai +      │
                                             │  Qdrant)        │
                                             └─────────────────┘
```

### Data Flow
1. **User Message** → Frontend → LiveKit Cloud → Python Agent
2. **AI Processing** → Gemini AI + Memory Retrieval → Response Generation  
3. **Response Delivery** → Python Agent → LiveKit Cloud → Frontend
4. **Memory Storage** → Facts Extraction → Vector Embeddings → Qdrant

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.13+ with pip
- **LiveKit Cloud** account and API keys
- **Google AI Studio** API key for Gemini
- **mem0.ai** API key (optional, graceful fallback)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/memora.git
cd memora
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3001
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the agent
python agent.py dev
```

### 4. Token Server
```bash
# In a separate terminal
cd backend
python token_server.py
# Server runs on http://localhost:3003
```

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# LiveKit Configuration (Required)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# AI Service (Required)
GEMINI_API_KEY=your_gemini_api_key

# Memory Service (Optional - graceful fallback if missing)
MEM0_API_KEY=your_mem0_api_key

# Optional Configuration
PYTHON_ENV=development
LOG_LEVEL=INFO
```

### Getting API Keys

1. **LiveKit Cloud**:
   - Sign up at [LiveKit Cloud](https://cloud.livekit.io)
   - Create a new project
   - Copy URL, API Key, and API Secret

2. **Google AI Studio**:
   - Visit [Google AI Studio](https://aistudio.google.com)
   - Generate API key for Gemini models

3. **mem0.ai**:
   - Sign up at [mem0.ai](https://mem0.ai)
   - Generate API key (optional - system works without it)

## 📖 Usage Guide

### Starting the Application

1. **Start Backend Services**:
   ```bash
   # Terminal 1: Main Agent
   cd backend && python agent.py dev
   
   # Terminal 2: Token Server
   cd backend && python token_server.py
   ```

2. **Start Frontend**:
   ```bash
   # Terminal 3: Frontend
   npm run dev
   ```

3. **Access Application**:
   - Open http://localhost:3001
   - Enter a room name (e.g., "general", "team-alpha")
   - Start chatting with the AI agent

### Using the Chat Interface

1. **Join a Room**: Enter any room name to create/join
2. **Send Messages**: Type and press Enter to send messages
3. **AI Responses**: AI responds contextually based on conversation history
4. **Multiple Users**: Different users can join the same room
5. **Memory Persistence**: AI remembers user preferences and conversation context

### Room Management

- **Room Names**: Can be any string (alphanumeric, hyphens, underscores)
- **Unique URLs**: Each room has a unique URL: `/chat/[room-name]`
- **Persistence**: Rooms persist until empty for 5 minutes
- **Rejoining**: Users can leave and rejoin rooms seamlessly

## 📡 API Documentation

### Token Generation Endpoint

**POST** `http://localhost:3003/token`

```javascript
// Request
{
  "room_name": "string",
  "participant_name": "string"
}

// Response
{
  "token": "jwt_token_string"
}
```

### WebRTC Data Channel Messages

**Message Format**:
```javascript
{
  "type": "chat-message",
  "content": "message_text",
  "sender": "participant_name",
  "timestamp": 1640995200000
}
```

### Agent Response Format
```javascript
{
  "type": "chat-message",
  "content": "ai_response_text", 
  "sender": "AI Assistant",
  "timestamp": 1640995200000
}
```

## 🛠 Development

### Project Structure
```
memora/
├── app/                    # Next.js pages
│   ├── chat/[room]/       # Dynamic room pages
│   └── api/livekit/token/ # Token generation API
├── components/            # React components
│   ├── chat/             # Chat-specific components  
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── backend/              # Python backend
│   ├── services/         # Core services
│   │   ├── ai_service.py
│   │   ├── memory_service.py
│   │   └── message_handler.py
│   ├── agent.py          # Main LiveKit agent
│   └── token_server.py   # JWT token server
└── utils/                # Shared utilities
```

### Development Workflow

1. **Frontend Development**:
   ```bash
   npm run dev          # Start with hot reload
   npm run build        # Production build
   npm run type-check   # TypeScript validation
   ```

2. **Backend Development**:
   ```bash
   python agent.py dev  # Development mode with file watching
   python agent.py start # Production mode
   ```

3. **Code Quality**:
   ```bash
   # Frontend
   npm run lint         # ESLint checks
   npm run format       # Prettier formatting
   
   # Backend  
   python -m pytest     # Run tests
   python -m black .    # Code formatting
   python -m mypy .     # Type checking
   ```

### Adding New Features

1. **Frontend Components**: Add to `components/` with TypeScript
2. **Backend Services**: Extend `services/` with dependency injection
3. **Memory Features**: Enhance `memory_service.py` with new capabilities
4. **AI Behavior**: Modify prompts and context in `ai_service.py`

## 🔧 Troubleshooting

### Common Issues

**1. Agent Not Connecting**
```bash
# Check agent logs
python agent.py dev

# Verify environment variables
cat backend/.env

# Test LiveKit connection
python -c "from livekit import api; print('LiveKit SDK working')"
```

**2. Frontend Connection Failed**
- Verify token server running on port 3003
- Check browser console for WebRTC errors
- Ensure LiveKit credentials are correct

**3. Memory Service Issues**
```bash
# Test mem0.ai connection
python -c "from mem0 import Memory; m = Memory(); print('Memory service working')"

# Check Qdrant status
curl http://localhost:6333/health
```

**4. WebRTC Connection Problems**
- Check firewall settings for ports 3001, 3003
- Verify LiveKit Cloud region settings
- Test with different browsers (Chrome recommended)

### Performance Optimization

1. **Memory Usage**: Monitor Qdrant database size and optimize embeddings
2. **Connection Speed**: Use closest LiveKit Cloud region
3. **AI Response Time**: Implement response caching for common queries
4. **Frontend Performance**: Implement message pagination for large conversations

### Error Codes

- `TOKEN_INVALID`: Regenerate LiveKit credentials
- `MEMORY_SERVICE_DOWN`: Check mem0.ai API key or use fallback mode
- `AGENT_TIMEOUT`: Restart agent service
- `ROOM_FULL`: Implement room capacity limits

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For technical support or feature requests:
- Create an issue on GitHub
- Join our community discussions
- Review the troubleshooting guide above

---

**Built with ❤️ using modern web technologies**
