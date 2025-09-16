import { useState, useEffect, useCallback, useRef } from 'react'

// TypeScript Interfaces and Types
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface Message {
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

export interface Participant {
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
  messages: Message[]
  participants: Participant[]
  state: ConnectionState
  error: string | null
  
  // Room info
  roomName: string | null
  localParticipant: Participant | null
  
  // Media controls (for future implementation)
  toggleAudio: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
}

/**
 * Custom React hook for managing LiveKit room connections and real-time communication
 * 
 * This hook encapsulates all LiveKit-specific logic and provides a clean interface
 * for React components to interact with real-time communication features.
 * 
 * @param config - LiveKit configuration object
 * @returns Object containing connection methods, state, and real-time data
 */
export default function useLiveKit(config: LiveKitConfig): UseLiveKitReturn {
  // State management
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null)

  // Refs for cleanup and state persistence
  const roomRef = useRef<any>(null) // TODO: Replace with Room from @livekit/client
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageIdCounterRef = useRef(0)
  const isConnectedRef = useRef(false)

  // TODO: Import LiveKit SDK
  // import { Room, RoomEvent, DataPacket_Kind, RemoteParticipant, LocalParticipant } from '@livekit/client'

  /**
   * Generate unique message ID
   */
  const generateMessageId = useCallback((): string => {
    messageIdCounterRef.current += 1
    return `msg_${Date.now()}_${messageIdCounterRef.current}`
  }, [])

  /**
   * Create a system message
   */
  const createSystemMessage = useCallback((text: string): Message => {
    return {
      id: generateMessageId(),
      text,
      sender: {
        id: 'system',
        identity: 'system',
        name: 'System',
        isLocal: false
      },
      timestamp: new Date(),
      type: 'system'
    }
  }, [generateMessageId])

  /**
   * Create local participant object
   */
  const createLocalParticipant = useCallback((): Participant => {
    return {
      id: `local_${config.identity}`,
      identity: config.identity,
      name: config.identity,
      isLocal: true,
      connectionState: 'connected',
      joinedAt: new Date(),
      lastSeen: new Date(),
      audioEnabled: config.options?.publishDefaults?.audioEnabled ?? false,
      videoEnabled: config.options?.publishDefaults?.videoEnabled ?? false,
      screenShareEnabled: false,
      isSpeaking: false
    }
  }, [config.identity, config.options])

  /**
   * Simulate remote participant joining (placeholder for LiveKit participant events)
   */
  const simulateRemoteParticipantJoin = useCallback((identity: string) => {
    // Don't add if already exists
    if (participants.some(p => p.identity === identity)) {
      return
    }

    const newParticipant: Participant = {
      id: `remote_${identity}_${Date.now()}`,
      identity,
      name: identity,
      isLocal: false,
      connectionState: 'connected',
      joinedAt: new Date(),
      lastSeen: new Date(),
      audioEnabled: Math.random() > 0.5,
      videoEnabled: Math.random() > 0.5,
      screenShareEnabled: false,
      isSpeaking: false
    }

    setParticipants(prev => [...prev, newParticipant])
    setMessages(prev => [...prev, createSystemMessage(`${identity} joined the room`)])
  }, [participants, createSystemMessage])

  /**
   * Connect to LiveKit room
   */
  const connect = useCallback(async (): Promise<void> => {
    if (state === ConnectionState.CONNECTING || state === ConnectionState.CONNECTED) {
      return
    }

    // Validate required config
    if (!config.token || !config.room || !config.identity) {
      const missingFields = []
      if (!config.token) missingFields.push('token')
      if (!config.room) missingFields.push('room')
      if (!config.identity) missingFields.push('identity')
      
      const errorMsg = `Missing required configuration: ${missingFields.join(', ')}`
      setState(ConnectionState.ERROR)
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      setState(ConnectionState.CONNECTING)
      setError(null)

      // TODO: Initialize LiveKit Room
      // const room = new Room({
      //   adaptiveStream: true,
      //   dynacast: true,
      //   ...config.options
      // })

      // TODO: Set up event listeners
      // room.on(RoomEvent.Connected, handleRoomConnected)
      // room.on(RoomEvent.Disconnected, handleRoomDisconnected)
      // room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      // room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      // room.on(RoomEvent.DataReceived, handleDataReceived)
      // room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
      // room.on(RoomEvent.Reconnecting, handleReconnecting)
      // room.on(RoomEvent.Reconnected, handleReconnected)

      // TODO: Connect to room
      // await room.connect(config.serverUrl || 'wss://your-livekit-server.com', config.token)
      // roomRef.current = room

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate successful connection
      setState(ConnectionState.CONNECTED)
      setRoomName(config.room)
      isConnectedRef.current = true
      
      // Create and set local participant
      const localParticipantData = createLocalParticipant()
      setLocalParticipant(localParticipantData)
      setParticipants([localParticipantData])
      
      // Add welcome message
      setMessages([createSystemMessage(`Connected to room: ${config.room}`)])

      // Simulate other participants joining (for demo purposes)
      setTimeout(() => {
        if (isConnectedRef.current) {
          simulateRemoteParticipantJoin('Alice')
        }
      }, 2000)
      setTimeout(() => {
        if (isConnectedRef.current) {
          simulateRemoteParticipantJoin('Bob')
        }
      }, 4000)

      console.log('✅ Connected to LiveKit room:', config.room)

    } catch (err) {
      console.error('❌ Failed to connect to LiveKit room:', err)
      setState(ConnectionState.ERROR)
      setError(err instanceof Error ? err.message : 'Connection failed')
      isConnectedRef.current = false
      throw err
    }
  }, [state, config, createLocalParticipant, createSystemMessage, simulateRemoteParticipantJoin])

  /**
   * Disconnect from LiveKit room
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (state === ConnectionState.DISCONNECTED) {
      return
    }
    try {
      console.log('🔌 Disconnecting from LiveKit room...')
      
      // TODO: Disconnect from LiveKit room
      // if (roomRef.current) {
      //   await roomRef.current.disconnect()
      //   roomRef.current = null
      // }

      // Simulate disconnection delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setState(ConnectionState.DISCONNECTED)
      isConnectedRef.current = false

      // Clear state
      setMessages([])
      setParticipants([])
      setRoomName(null)
      setLocalParticipant(null)
      setError(null)

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      console.log('✅ Disconnected from LiveKit room')

    } catch (err) {
      console.error('❌ Failed to disconnect from LiveKit room:', err)
      setError(err instanceof Error ? err.message : 'Disconnection failed')
      throw err
    }
  }, [])

  /**
   * Send message to room participants
   */
  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (state !== ConnectionState.CONNECTED || !localParticipant) {
      throw new Error('Not connected to room')
    }

    if (!text.trim()) {
      throw new Error('Message cannot be empty')
    }
    try {
      // TODO: Send data using LiveKit
      // const encoder = new TextEncoder()
      // const data = encoder.encode(JSON.stringify({
      //   type: 'chat',
      //   message: text,
      //   timestamp: Date.now(),
      //   sender: config.identity
      // }))
      // 
      // await roomRef.current?.localParticipant.publishData(
      //   data,
      //   DataPacket_Kind.RELIABLE
      // )

      // Simulate message sending
      const newMessage: Message = {
        id: generateMessageId(),
        text: text.trim(),
        sender: {
          id: localParticipant.id,
          identity: localParticipant.identity,
          name: localParticipant.name,
          isLocal: true
        },
        timestamp: new Date(),
        type: 'text'
      }

      setMessages(prev => [...prev, newMessage])
      console.log('✅ Message sent:', text.trim())

      // Simulate receiving responses (for demo purposes)
      if (text.toLowerCase().includes('hello') && isConnectedRef.current) {
        setTimeout(() => {
          if (!isConnectedRef.current) return
          
          const responseMessage: Message = {
            id: generateMessageId(),
            text: 'Hello there! 👋',
            sender: {
              id: 'remote_alice',
              identity: 'Alice',
              name: 'Alice',
              isLocal: false
            },
            timestamp: new Date(),
            type: 'text'
          }
          setMessages(prev => [...prev, responseMessage])
        }, 1000)
      }

    } catch (err) {
      console.error('❌ Failed to send message:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to send message')
    }
  }, [state, localParticipant, config.identity, generateMessageId])

  /**
   * Toggle audio (placeholder for future implementation)
   */
  const toggleAudio = useCallback(async (): Promise<void> => {
    if (!localParticipant || state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to room')
    }

    try {
      // TODO: Implement audio toggle with LiveKit
      // await roomRef.current?.localParticipant.setMicrophoneEnabled(!localParticipant.audioEnabled)

      setLocalParticipant(prev => prev ? { ...prev, audioEnabled: !prev.audioEnabled } : null)
      setParticipants(prev => prev.map(p => 
        p.isLocal ? { ...p, audioEnabled: !p.audioEnabled } : p
      ))

      console.log('🎤 Audio toggled:', !localParticipant.audioEnabled)
    } catch (err) {
      console.error('❌ Failed to toggle audio:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle audio')
    }
  }, [localParticipant])

  /**
   * Toggle video (placeholder for future implementation)
   */
  const toggleVideo = useCallback(async (): Promise<void> => {
    if (!localParticipant || state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to room')
    }

    try {
      // TODO: Implement video toggle with LiveKit
      // await roomRef.current?.localParticipant.setCameraEnabled(!localParticipant.videoEnabled)

      setLocalParticipant(prev => prev ? { ...prev, videoEnabled: !prev.videoEnabled } : null)
      setParticipants(prev => prev.map(p => 
        p.isLocal ? { ...p, videoEnabled: !p.videoEnabled } : p
      ))

      console.log('📹 Video toggled:', !localParticipant.videoEnabled)
    } catch (err) {
      console.error('❌ Failed to toggle video:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle video')
    }
  }, [localParticipant])

  /**
   * Toggle screen share (placeholder for future implementation)
   */
  const toggleScreenShare = useCallback(async (): Promise<void> => {
    if (!localParticipant || state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected to room')
    }

    try {
      // TODO: Implement screen share toggle with LiveKit
      // if (localParticipant.screenShareEnabled) {
      //   await roomRef.current?.localParticipant.unpublishTrack(screenShareTrack)
      // } else {
      //   await roomRef.current?.localParticipant.setScreenShareEnabled(true)
      // }

      setLocalParticipant(prev => prev ? { ...prev, screenShareEnabled: !prev.screenShareEnabled } : null)
      setParticipants(prev => prev.map(p => 
        p.isLocal ? { ...p, screenShareEnabled: !p.screenShareEnabled } : p
      ))

      console.log('🖥️ Screen share toggled:', !localParticipant.screenShareEnabled)
    } catch (err) {
      console.error('❌ Failed to toggle screen share:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle screen share')
    }
  }, [localParticipant])

  // TODO: Event handlers for LiveKit events
  // const handleRoomConnected = useCallback(() => {
  //   setState(ConnectionState.CONNECTED)
  //   setError(null)
  // }, [])

  // const handleRoomDisconnected = useCallback((reason?: string) => {
  //   setState(ConnectionState.DISCONNECTED)
  //   if (reason) {
  //     setError(`Disconnected: ${reason}`)
  //   }
  // }, [])

  // const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
  //   const newParticipant: Participant = {
  //     id: participant.sid,
  //     identity: participant.identity,
  //     name: participant.name || participant.identity,
  //     isLocal: false,
  //     connectionState: 'connected',
  //     joinedAt: new Date(),
  //     lastSeen: new Date(),
  //     audioEnabled: participant.isMicrophoneEnabled,
  //     videoEnabled: participant.isCameraEnabled,
  //     screenShareEnabled: participant.isScreenShareEnabled,
  //     isSpeaking: participant.isSpeaking
  //   }
  //   
  //   setParticipants(prev => [...prev, newParticipant])
  //   setMessages(prev => [...prev, createSystemMessage(`${participant.identity} joined`)])
  // }, [createSystemMessage])

  // const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
  //   setParticipants(prev => prev.filter(p => p.id !== participant.sid))
  //   setMessages(prev => [...prev, createSystemMessage(`${participant.identity} left`)])
  // }, [createSystemMessage])

  // const handleDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
  //   try {
  //     const decoder = new TextDecoder()
  //     const data = JSON.parse(decoder.decode(payload))
  //     
  //     if (data.type === 'chat' && participant) {
  //       const newMessage: Message = {
  //         id: generateMessageId(),
  //         text: data.message,
  //         sender: {
  //           id: participant.sid,
  //           identity: participant.identity,
  //           name: participant.name || participant.identity,
  //           isLocal: false
  //         },
  //         timestamp: new Date(data.timestamp),
  //         type: 'text'
  //       }
  //       
  //       setMessages(prev => [...prev, newMessage])
  //     }
  //   } catch (err) {
  //     console.error('Failed to parse received data:', err)
  //   }
  // }, [generateMessageId])

  // const handleConnectionStateChanged = useCallback((connectionState: ConnectionState) => {
  //   setState(connectionState)
  // }, [])

  // const handleReconnecting = useCallback(() => {
  //   setState(ConnectionState.RECONNECTING)
  // }, [])

  // const handleReconnected = useCallback(() => {
  //   setState(ConnectionState.CONNECTED)
  //   setError(null)
  // }, [])

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      isConnectedRef.current = false
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      // TODO: Disconnect from room if connected
      // if (roomRef.current) {
      //   roomRef.current.disconnect()
      // }
    }
  }, [])

  /**
   * Auto-reconnection logic (disabled for now to avoid infinite loops in demo)
   */
  // useEffect(() => {
  //   if (state === ConnectionState.ERROR && config.token) {
  //     // TODO: Implement exponential backoff reconnection strategy
  //     reconnectTimeoutRef.current = setTimeout(() => {
  //       console.log('🔄 Attempting to reconnect...')
  //       connect()
  //     }, 5000)
  //   }

  //   return () => {
  //     if (reconnectTimeoutRef.current) {
  //       clearTimeout(reconnectTimeoutRef.current)
  //       reconnectTimeoutRef.current = null
  //     }
  //   }
  // }, [state, config.token, connect])

  // Return hook interface
  return {
    // Connection methods
    connect,
    disconnect,
    
    // Messaging
    sendMessage,
    
    // State
    messages,
    participants,
    state,
    error,
    
    // Room info
    roomName,
    localParticipant,
    
    // Media controls
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  }
}

// Export types for external use
export type { LiveKitConfig, UseLiveKitReturn, Message, Participant }