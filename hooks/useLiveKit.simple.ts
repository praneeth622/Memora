import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Room, 
  RoomEvent, 
  DataPacket_Kind, 
  RemoteParticipant, 
  LocalParticipant,
  Participant as LiveKitSDKParticipant,
  ConnectionState as LiveKitConnectionState,
  RoomConnectOptions,
  ConnectionQuality,
  DisconnectReason
} from 'livekit-client'
import { 
  generateAccessToken, 
  defaultRoomOptions, 
  defaultConnectOptions, 
  LIVEKIT_URL,
  createMessageData,
  parseMessageData
} from '@/lib/livekit'
import { 
  LiveKitMessage as Message,
  LiveKitParticipant as Participant,
  LiveKitConfig,
  UseLiveKitReturn,
  ConnectionState
} from '@/lib/types'

/**
 * Simplified version of useLiveKit hook to identify Fast Refresh issues
 */
export default function useSimpleLiveKit(config: Partial<LiveKitConfig>): UseLiveKitReturn {
  console.log('🎣 useSimpleLiveKit hook called with config:', config)
  
  // Basic state
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Stable functions with empty dependencies
  const connect = useCallback(async (): Promise<void> => {
    console.log('🔌 Simple connect called')
    // TODO: Implement connection logic
  }, [])

  const disconnect = useCallback(async (): Promise<void> => {
    console.log('🔌 Simple disconnect called')
    // TODO: Implement disconnect logic
  }, [])

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    console.log('💬 Simple sendMessage called with:', text)
    // TODO: Implement sendMessage logic
  }, [])

  const toggleAudio = useCallback(async (): Promise<void> => {
    console.log('🎤 Simple toggleAudio called')
  }, [])

  const toggleVideo = useCallback(async (): Promise<void> => {
    console.log('📹 Simple toggleVideo called')
  }, [])

  const toggleScreenShare = useCallback(async (): Promise<void> => {
    console.log('🖥️ Simple toggleScreenShare called')
  }, [])

  console.log('🎣 useSimpleLiveKit returning functions: {',
    'connectExists:', !!connect,
    'disconnectExists:', !!disconnect,
    'connectType:', typeof connect,
    'disconnectType:', typeof disconnect,
    '}')

  return {
    connect,
    disconnect,
    sendMessage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    messages,
    participants,
    localParticipant,
    state,
    roomName,
    error
  }
}