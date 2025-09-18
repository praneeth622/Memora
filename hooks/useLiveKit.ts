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
 * Custom React hook for managing LiveKit room connections and real-time communication
 * 
 * This hook encapsulates all LiveKit-specific logic and provides a clean interface
 * for React components to interact with real-time communication features.
 * 
 * @param config - LiveKit configuration object
 * @returns Object containing connection methods, state, and real-time data
 */
/**
 * Custom hook for LiveKit integration
 */
export default function useLiveKit(config: Partial<LiveKitConfig>): UseLiveKitReturn {
  console.log('🎣 useLiveKit hook called with config:', config)
  
  // Store config in ref to prevent stale closures without affecting dependencies
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }) // Remove config dependency to prevent Fast Refresh issues
  
  // State management
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  
  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state
  }, [state])
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
  const stateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED)
  const connectingRef = useRef(false) // Track if connection is in progress
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelayMs = 2000
  const lastConnectionParamsRef = useRef<{roomName: string, identity: string} | null>(null)

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
  }, []) // Remove dependency on generateMessageId since it has no dependencies





  /**
   * Connect to LiveKit room
   */
  const connect = useCallback(async (): Promise<void> => {
    const currentConfig = configRef.current
    console.log('🔌 useLiveKit.connect() called with config:', currentConfig)
    console.log('🔌 Current state:', stateRef.current, 'Connecting:', connectingRef.current, 'Connected:', isConnectedRef.current)
    
    // Prevent multiple simultaneous connections using multiple guards
    if (isConnectedRef.current || connectingRef.current || 
        stateRef.current === ConnectionState.CONNECTING || 
        stateRef.current === ConnectionState.CONNECTED) {
      console.log('🔌 Already connecting or connected, skipping. State:', stateRef.current)
      return
    }

    // Set connecting flag immediately to prevent race conditions
    connectingRef.current = true

    // Validate required config (token will be generated if not provided)
    if (!currentConfig.room || !currentConfig.identity) {
      const missingFields = []
      if (!currentConfig.room) missingFields.push('room')
      if (!currentConfig.identity) missingFields.push('identity')
      
      const errorMsg = `Missing required configuration: ${missingFields.join(', ')}`
      setState(ConnectionState.ERROR)
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      setState(ConnectionState.CONNECTING)
      setError(null)
      
      // Store connection parameters for potential reconnection
      lastConnectionParamsRef.current = {
        roomName: currentConfig.room,
        identity: currentConfig.identity
      }

      // Get token from server or use provided token
      let token: string
      if (currentConfig.token) {
        token = currentConfig.token
      } else {
        // Fetch token from backend server
        const tokenServerUrl = process.env.NEXT_PUBLIC_TOKEN_SERVER_URL || 'http://localhost:3003'
        const response = await fetch(`${tokenServerUrl}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room: currentConfig.room,
            identity: currentConfig.identity
          })
        })
        
        if (!response.ok) {
          throw new Error(`Token server error: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        token = data.token
        console.log('🎫 Got valid token from server')
      }

      // Initialize LiveKit Room
      console.log('🏗️ Creating LiveKit room with data-only configuration...')
      const room = new Room({
        ...defaultRoomOptions,
        // Additional options for stability
        stopLocalTrackOnUnpublish: false,
      })

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to LiveKit room:', currentConfig.room)
        setState(ConnectionState.CONNECTED)
        setRoomName(currentConfig.room || null)
        isConnectedRef.current = true

        // Update participants with all current participants
        const allParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
        const convertedParticipants = allParticipants.map(convertParticipant)
        setParticipants(convertedParticipants)
        setLocalParticipant(convertParticipant(room.localParticipant))

        // Add welcome message
        setMessages([createSystemMessage(`Connected to room: ${currentConfig.room}`)])
      })

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('🔌 Disconnected from LiveKit room, reason:', reason)
        setState(ConnectionState.DISCONNECTED)
        isConnectedRef.current = false
        connectingRef.current = false
        
        // Add error message for unexpected disconnections
        if (reason && reason !== DisconnectReason.CLIENT_INITIATED) {
          console.warn('⚠️ Unexpected disconnection from LiveKit room:', reason)
          setError(`Connection lost: ${reason || 'Unknown reason'}`)
        } else {
          // Clear error for intentional disconnections
          setError(null)
        }
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
        console.log('📦 Raw payload:', payload)
        
        const messageData = parseMessageData(payload)
        console.log('📋 Parsed message data:', messageData)
        
        if (messageData && messageData.type === 'chat-message') {
          console.log('✅ Valid chat message, creating new message object')
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
          console.log('📝 New message object:', newMessage)
          setMessages(prev => {
            const updated = [...prev, newMessage]
            console.log('📚 Updated messages array:', updated)
            return updated
          })
        } else {
          console.log('❌ Invalid or non-chat message data:', messageData)
        }
      })

      room.on(RoomEvent.Reconnecting, () => {
        console.log('🔄 Reconnecting to LiveKit room...')
        setState(ConnectionState.RECONNECTING)
        reconnectAttemptsRef.current += 1
        setError('Reconnecting...')
      })

      room.on(RoomEvent.Reconnected, () => {
        console.log('✅ Reconnected to LiveKit room')
        setState(ConnectionState.CONNECTED)
        isConnectedRef.current = true
        reconnectAttemptsRef.current = 0 // Reset on successful reconnection
        setError(null) // Clear any previous errors
      })

      // Add connection state change handler to catch signaling state issues
      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log(`📊 Connection quality for ${participant?.identity || 'local'}: ${quality}`)
        if (quality === ConnectionQuality.Poor) {
          console.warn('⚠️ Poor connection quality detected')
          setError('Poor connection quality - may experience issues')
        } else if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
          // Clear quality-related errors when connection improves
          if (error && error.includes('Poor connection')) {
            setError(null)
          }
        }
      })



      // Connect to room with retry logic
      const serverUrl = currentConfig.serverUrl || LIVEKIT_URL
      const connectOptions = {
        ...defaultConnectOptions,
        // Use data-only mode for chat application  
        autoSubscribe: false, // Don't automatically subscribe to audio/video
        // Add WebRTC stability options
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10,
          bundlePolicy: 'balanced' as RTCBundlePolicy,
          rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
        }
      }
      
      console.log('🔌 Attempting to connect to LiveKit server:', serverUrl)
      console.log('🎫 Using token:', token.substring(0, 50) + '...')
      console.log('⚙️ Connect options:', connectOptions)
      
      // Add timeout to connection with retry logic
      const maxRetries = 3
      let retryCount = 0
      let lastError: Error | null = null
      
      while (retryCount < maxRetries) {
        try {
          const connectionPromise = room.connect(serverUrl, token, connectOptions)
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
          )
          
          await Promise.race([connectionPromise, timeoutPromise])
          break // Success - exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown connection error')
          retryCount++
          
          if (retryCount < maxRetries) {
            console.warn(`🔄 Connection attempt ${retryCount} failed, retrying in ${retryCount * 2}s:`, lastError.message)
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
          }
        }
      }
      
      if (retryCount >= maxRetries && lastError) {
        throw lastError
      }
      
      // Check if component is still mounted after async operation
      if (!connectingRef.current) {
        console.log('🔌 Component unmounted during connection, aborting')
        room.disconnect().catch(() => {}) // Disconnect the room we just connected
        return
      }
      
      roomRef.current = room
      isConnectedRef.current = true
      connectingRef.current = false // Clear connecting flag on success

      console.log('✅ Successfully connected to LiveKit room:', currentConfig.room)
      console.log('✅ Room state:', room.state)
      console.log('✅ Local participant:', room.localParticipant.identity)

    } catch (err) {
      console.error('❌ Failed to connect to LiveKit room:', err)
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        serverUrl: currentConfig.serverUrl || LIVEKIT_URL,
        room: currentConfig.room,
        identity: currentConfig.identity
      })
      
      // Clean up state on error
      setState(ConnectionState.ERROR)
      setError(err instanceof Error ? err.message : 'Connection failed')
      isConnectedRef.current = false
      connectingRef.current = false // Clear connecting flag on error
      
      // Clean up any partially created room
      if (roomRef.current) {
        roomRef.current.disconnect().catch(() => {})
        roomRef.current = null
      }
      
      // Don't throw the error to prevent app crashes, just log it
      return
    }
  }, []) // Simplified dependencies to prevent function recreation

  /**
   * Automatic reconnection with exponential backoff
   */
  const attemptReconnect = useCallback(async (): Promise<void> => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached`)
      setState(ConnectionState.ERROR)
      setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`)
      return
    }

    if (!lastConnectionParamsRef.current) {
      console.error('❌ No previous connection parameters for reconnection')
      return
    }

    const delay = reconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current)
    console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        // Call connect function directly without depending on it in useCallback
        await connect()
      } catch (err) {
        console.error('❌ Reconnection attempt failed:', err)
        await attemptReconnect() // Try again
      }
    }, delay)
  }, []) // Remove connect dependency to prevent recreation

  /**
   * Disconnect from LiveKit room
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (stateRef.current === ConnectionState.DISCONNECTED) {
      return
    }
    try {
      console.log('🔌 Disconnecting from LiveKit room...')
      
      // Set state immediately to prevent race conditions
      setState(ConnectionState.DISCONNECTED)
      isConnectedRef.current = false
      connectingRef.current = false

      // Disconnect from LiveKit room with proper cleanup
      if (roomRef.current) {
        try {
          // Remove all event listeners to prevent callbacks after disconnect
          roomRef.current.removeAllListeners()
          
          // Disconnect with proper cleanup
          await roomRef.current.disconnect(true) // Pass true for cleanup
          roomRef.current = null
        } catch (disconnectErr) {
          console.warn('⚠️ Error during room disconnect (non-fatal):', disconnectErr)
          roomRef.current = null // Force cleanup even if disconnect fails
        }
      }

      // Clear state
      setMessages([])
      setParticipants([])
      setRoomName(null)
      setLocalParticipant(null)
      setError(null)

      // Clear reconnection timeout and reset attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      reconnectAttemptsRef.current = 0 // Reset reconnection attempts on manual disconnect
      lastConnectionParamsRef.current = null // Clear stored connection params

      console.log('✅ Disconnected from LiveKit room')

    } catch (err) {
      console.error('❌ Failed to disconnect from LiveKit room:', err)
      // Don't set error state for disconnect failures - just log them
      console.warn('⚠️ Disconnect error is non-fatal, continuing...')
    }
  }, [])

  /**
   * Send message to room participants
   */
  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (stateRef.current !== ConnectionState.CONNECTED || !isConnectedRef.current) {
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

      const messageData = createMessageData(text.trim(), configRef.current.identity || 'unknown')
      await roomRef.current.localParticipant.publishData(messageData, { reliable: true })

      // Get current local participant from room instead of state (to avoid null issues)
      const currentLocalParticipant = roomRef.current.localParticipant

      // Add message to local state (for immediate display)
      const newMessage: Message = {
        id: generateMessageId(),
        text: text.trim(),
        sender: {
          id: currentLocalParticipant.sid || configRef.current.identity || 'unknown',
          identity: currentLocalParticipant.identity,
          name: currentLocalParticipant.name || currentLocalParticipant.identity,
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
  }, []) // Simplified dependencies to prevent function recreation

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
   * Cleanup effect - Properly disconnect when component unmounts
   */
  useEffect(() => {
    return () => {
      console.log('🧹 useLiveKit cleanup: Component unmounting')
      // Mark as disconnected immediately to prevent new connections
      isConnectedRef.current = false
      connectingRef.current = false
      
      // Clear any timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Disconnect from room if connected (prevents WebRTC errors)
      if (roomRef.current) {
        console.log('🧹 useLiveKit cleanup: Disconnecting from room')
        roomRef.current.disconnect().catch((err) => {
          console.warn('🧹 Error during room disconnect:', err)
        })
        roomRef.current = null
      }
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

  // Cleanup effect - TEMPORARILY DISABLED FOR DEBUGGING
  /*
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
    }
  }, [])
  */

  // Return hook interface
  console.log('🎣 useLiveKit returning functions:', {
    connectExists: !!connect,
    disconnectExists: !!disconnect,
    connectType: typeof connect,
    disconnectType: typeof disconnect
  })
  
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