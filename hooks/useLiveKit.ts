import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Room, 
  RoomEvent, 
  DataPacket_Kind, 
  RemoteParticipant, 
  LocalParticipant,
  Participant as LiveKitSDKParticipant,
  ConnectionState as LiveKitConnectionState,
  RoomConnectOptions
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
  const roomRef = useRef<Room | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageIdCounterRef = useRef(0)
  const isConnectedRef = useRef(false)

  /**
   * Convert LiveKit participant to our Participant interface
   */
  const convertParticipant = useCallback((lkParticipant: LiveKitSDKParticipant): Participant => {
    return {
      id: lkParticipant.sid || lkParticipant.identity,
      identity: lkParticipant.identity,
      name: lkParticipant.name || lkParticipant.identity,
      isLocal: lkParticipant instanceof LocalParticipant,
      connectionState: 'connected', // Simplified for now
      joinedAt: new Date(),
      lastSeen: new Date(),
      metadata: lkParticipant.metadata,
      audioEnabled: false, // Chat-only app
      videoEnabled: false, // Chat-only app
      screenShareEnabled: false,
      isSpeaking: false
    }
  }, [])

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

      // Generate access token via API
      let token: string
      if (config.token) {
        token = config.token
      } else {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: config.room,
            participantName: config.identity
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate access token')
        }
        
        const data = await response.json()
        token = data.token
      }

      // Initialize LiveKit Room
      const room = new Room(defaultRoomOptions)

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to LiveKit room:', config.room)
        setState(ConnectionState.CONNECTED)
        setRoomName(config.room)
        isConnectedRef.current = true

        // Update participants with all current participants
        const allParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
        const convertedParticipants = allParticipants.map(convertParticipant)
        setParticipants(convertedParticipants)
        setLocalParticipant(convertParticipant(room.localParticipant))

        // Add welcome message
        setMessages([createSystemMessage(`Connected to room: ${config.room}`)])
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔌 Disconnected from LiveKit room')
        setState(ConnectionState.DISCONNECTED)
        isConnectedRef.current = false
      })

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant connected:', participant.identity)
        setParticipants(prev => [...prev, convertParticipant(participant)])
        setMessages(prev => [...prev, createSystemMessage(`${participant.identity} joined the room`)])
      })

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant disconnected:', participant.identity)
        setParticipants(prev => prev.filter(p => p.id !== participant.sid))
        setMessages(prev => [...prev, createSystemMessage(`${participant.identity} left the room`)])
      })

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        console.log('📨 Data received from:', participant?.identity || 'unknown')
        const messageData = parseMessageData(payload)
        if (messageData && messageData.type === 'chat-message') {
          const newMessage: Message = {
            id: generateMessageId(),
            text: messageData.content,
            sender: {
              id: participant?.sid || 'unknown',
              identity: participant?.identity || messageData.sender,
              name: participant?.name || messageData.sender,
              isLocal: false
            },
            timestamp: new Date(messageData.timestamp),
            type: 'text'
          }
          setMessages(prev => [...prev, newMessage])
        }
      })

      room.on(RoomEvent.Reconnecting, () => {
        console.log('🔄 Reconnecting to LiveKit room...')
        setState(ConnectionState.RECONNECTING)
      })

      room.on(RoomEvent.Reconnected, () => {
        console.log('✅ Reconnected to LiveKit room')
        setState(ConnectionState.CONNECTED)
      })

      // Connect to room
      const serverUrl = config.serverUrl || LIVEKIT_URL
      await room.connect(serverUrl, token)
      roomRef.current = room

      console.log('✅ Successfully connected to LiveKit room:', config.room)

    } catch (err) {
      console.error('❌ Failed to connect to LiveKit room:', err)
      setState(ConnectionState.ERROR)
      setError(err instanceof Error ? err.message : 'Connection failed')
      isConnectedRef.current = false
      throw err
    }
  }, [state, config, convertParticipant, generateMessageId, createSystemMessage])

  /**
   * Disconnect from LiveKit room
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (state === ConnectionState.DISCONNECTED) {
      return
    }
    try {
      console.log('🔌 Disconnecting from LiveKit room...')
      
      // Disconnect from LiveKit room
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }

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
      // Send data using LiveKit
      if (!roomRef.current) {
        throw new Error('Room not connected')
      }

      const messageData = createMessageData(text.trim(), config.identity)
      await roomRef.current.localParticipant.publishData(messageData, { reliable: true })

      // Add message to local state (for immediate display)
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
export { ConnectionState } from '@/lib/types'