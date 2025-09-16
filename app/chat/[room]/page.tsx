"use client"

import React, { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserList } from '@/components/chat/user-list'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { MessageCircle, Wifi, WifiOff, Loader2 } from 'lucide-react'
import useLiveKit, { ConnectionState } from '@/hooks/useLiveKit'
import { LiveKitConfig, ChatPageProps } from '@/lib/types'

// Add this export to allow dynamic parameters
export const dynamicParams = true

export default function ChatRoomPage({ params, searchParams }: ChatPageProps) {
  const { room } = params
  const { username } = searchParams

  // Validate required parameters
  if (!room) {
    notFound()
  }

  if (!username) {
    // Redirect to home page if username is missing
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Missing Username</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Username is required to join the chat room.
            </p>
            <a 
              href="/" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Go Back to Home
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Decode URL parameters
  const decodedRoom = decodeURIComponent(room)
  const decodedUsername = decodeURIComponent(username)

  // LiveKit configuration
  const liveKitConfig: LiveKitConfig = {
    token: '', // Will be generated in the hook
    room: room,
    identity: decodedUsername,
    serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    options: {
      autoSubscribe: true,
      publishDefaults: {
        audioEnabled: false,
        videoEnabled: false
      }
    }
  }

  // Use LiveKit hook
  const {
    connect,
    disconnect,
    sendMessage,
    messages: liveKitMessages,
    participants: liveKitParticipants,
    state,
    error
  } = useLiveKit(liveKitConfig)

  // Auto-connect on component mount
  useEffect(() => {
    connect().catch(console.error)
    
    // Cleanup on unmount
    return () => {
      disconnect().catch(console.error)
    }
  }, [connect, disconnect])

  // Connection status
  const isConnected = state === ConnectionState.CONNECTED
  const isConnecting = state === ConnectionState.CONNECTING
  const isReconnecting = state === ConnectionState.RECONNECTING

  // Convert LiveKit participants to UserList format
  const participants = liveKitParticipants.map(participant => ({
    id: participant.id,
    username: participant.name,
    isOnline: participant.connectionState === 'connected'
  }))

  // Convert LiveKit messages to MessageList format  
  const messages = liveKitMessages.map(message => ({
    id: message.id,
    username: message.sender.name,
    content: message.text,
    timestamp: message.timestamp,
    type: message.type as 'text' | 'system'
  }))

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content)
    } catch (error) {
      console.error('Failed to send message:', error)
      // You could add toast notification here
    }
  }

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Connecting to room...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => connect().catch(console.error)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {decodedRoom}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {participants.filter(p => p.isOnline).length} participants online
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isConnected ? "default" : isReconnecting ? "secondary" : "destructive"}
                className="flex items-center space-x-1"
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
                  </>
                ) : isReconnecting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Reconnecting</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Disconnected</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - User List */}
        <aside className="w-64 border-r border-border bg-card/30 hidden md:block">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Participants ({participants.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <UserList 
                users={participants} 
                currentUsername={decodedUsername}
              />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages}
              currentUsername={decodedUsername}
            />
          </div>

          {/* Message Input */}
          <div className="border-t border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <div className="p-4">
              <MessageInput 
                onSendMessage={handleSendMessage}
                disabled={!isConnected}
                placeholder={isConnected ? `Message ${decodedRoom}...` : "Connecting..."}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile User List Toggle - TODO: Implement mobile drawer */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        {/* TODO: Add floating action button to show user list on mobile */}
      </div>
    </div>
  )
}