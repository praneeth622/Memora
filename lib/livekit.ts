import { Room, RoomConnectOptions, RoomOptions } from 'livekit-client';

// LiveKit server configuration
export const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

// Application configuration
export const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME || 'AI-Assistant';
export const DEFAULT_ROOM_NAME = process.env.NEXT_PUBLIC_DEFAULT_ROOM_NAME || 'ai-chat-room';

/**
 * Generate a LiveKit access token for a user
 * Note: In production, this should be done on the server-side
 * For now, we'll use a simplified token generation approach
 */
export async function generateAccessToken(roomName: string, participantName: string): Promise<string> {
  // In a real application, this would be an API call to your backend
  // For development purposes, we'll use a mock token
  // TODO: Replace with actual backend API call
  const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MjY1MTIwMDAsImV4cCI6MTcyNjU5ODQwMCwiaXNzIjoidGVzdCIsInN1YiI6IiR7cGFydGljaXBhbnROYW1lfSIsInZpZGVvIjp7InJvb20iOiIke3Jvb21OYW1lfSIsInJvb21Kb2luIjp0cnVlLCJjYW5QdWJsaXNoIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlfX0.mock-signature`;
  
  return mockToken.replace('${participantName}', participantName).replace('${roomName}', roomName);
}

/**
 * Default room options for LiveKit connections
 */
export const defaultRoomOptions: RoomOptions = {
  adaptiveStream: false,  // Disable for chat-only mode
  dynacast: false,        // Not needed for data-only
  publishDefaults: {
    simulcast: false,     // Not needed for data-only
    videoSimulcastLayers: [], // No video
    audioPreset: undefined,   // No audio
  },
  // Optimize for data-only connections
  webAudioMix: false,
};

/**
 * Default connection options for LiveKit rooms
 */
export const defaultConnectOptions: RoomConnectOptions = {
  autoSubscribe: true,
  maxRetries: 5,
  peerConnectionTimeout: 30000,
  // Add WebRTC configuration for better connectivity
  rtcConfig: {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: 'stun:stun1.l.google.com:19302',
      },
    ],
    iceCandidatePoolSize: 10,
  },
};

/**
 * Utility function to validate LiveKit configuration
 */
export function validateLiveKitConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!LIVEKIT_URL) {
    errors.push('NEXT_PUBLIC_LIVEKIT_URL environment variable is required');
  }

  // Validate URL format
  if (LIVEKIT_URL && !LIVEKIT_URL.startsWith('wss://')) {
    errors.push('NEXT_PUBLIC_LIVEKIT_URL must be a secure WebSocket URL (wss://)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create message data for LiveKit data channel
 */
export function createMessageData(content: string, senderName: string): Uint8Array {
  const message = {
    type: 'chat-message',
    content,
    sender: senderName,
    timestamp: Date.now(),
  };

  return new TextEncoder().encode(JSON.stringify(message));
}

/**
 * Parse message data from LiveKit data channel
 */
export function parseMessageData(data: Uint8Array): {
  type: string;
  content: string;
  sender: string;
  timestamp: number;
} | null {
  try {
    const text = new TextDecoder().decode(data);
    const parsed = JSON.parse(text);
    
    if (parsed.type === 'chat-message' && parsed.content && parsed.sender && parsed.timestamp) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse message data:', error);
    return null;
  }
}