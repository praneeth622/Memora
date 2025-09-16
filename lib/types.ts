// LiveKit and Chat Types for the Memora Frontend Application

export interface LiveKitMessage {
  id: string
  text: string
  sender: {
    id: string
    identity: string
    name: string
    isLocal: boolean
  }
  timestamp: Date
  type: 'text' | 'system'
}

export interface LiveKitParticipant {
  id: string
  identity: string
  name: string
  isLocal: boolean
  connectionState: 'connected' | 'disconnected' | 'reconnecting'
  joinedAt: Date
  lastSeen: Date
  metadata?: string
  audioEnabled: boolean
  videoEnabled: boolean
  screenShareEnabled: boolean
  isSpeaking: boolean
}

export interface LiveKitConfig {
  token: string
  room: string
  identity: string
  serverUrl?: string
  options?: {
    autoSubscribe?: boolean
    publishDefaults?: {
      audioEnabled?: boolean
      videoEnabled?: boolean
    }
  }
}

export interface UseLiveKitReturn {
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Messaging
  sendMessage: (text: string) => Promise<void>
  
  // State
  messages: LiveKitMessage[]
  participants: LiveKitParticipant[]
  state: ConnectionState
  error: string | null
  
  // Room info
  roomName: string | null
  localParticipant: LiveKitParticipant | null
  
  // Media controls (for future implementation)
  toggleAudio: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Component-specific types for UI components

export interface ChatMessage {
  id: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'system'
}

export interface ChatUser {
  id: string
  username: string
  isOnline: boolean
  avatar?: string
}

export interface ChatPageProps {
  params: {
    room: string
  }
  searchParams: {
    username?: string
  }
}

// API Response Types

export interface TokenResponse {
  token: string
}

export interface TokenRequest {
  roomName: string
  participantName: string
}