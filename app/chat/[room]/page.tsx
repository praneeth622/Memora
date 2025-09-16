"use client"

import React from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserList } from '@/components/chat/user-list'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'

// Add this export to allow dynamic parameters
export const dynamicParams = true

// TypeScript interfaces
interface ChatPageProps {
  params: {
    room: string
  }
  searchParams: {
    username?: string
  }
}

interface User {
  id: string
  username: string
  isOnline: boolean
  avatar?: string
}

interface Message {
  id: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'system'
}

// Mock data for development
const mockUsers: User[] = [
  { id: '1', username: 'Alice', isOnline: true },
  { id: '2', username: 'Bob', isOnline: true },
  { id: '3', username: 'Charlie', isOnline: false },
  { id: '4', username: 'Diana', isOnline: true },
]

const mockMessages: Message[] = [
  {
    id: '1',
    username: 'System',
    content: 'Welcome to the chat room!',
    timestamp: new Date(Date.now() - 300000),
    type: 'system'
  },
  {
    id: '2',
    username: 'Alice',
    content: 'Hey everyone! How is everyone doing today?',
    timestamp: new Date(Date.now() - 240000),
    type: 'text'
  },
  {
    id: '3',
    username: 'Bob',
    content: 'Great! Just working on some new projects. What about you?',
    timestamp: new Date(Date.now() - 180000),
    type: 'text'
  },
  {
    id: '4',
    username: 'Alice',
    content: 'Same here! Really excited about what we\'re building.',
    timestamp: new Date(Date.now() - 120000),
    type: 'text'
  },
  {
    id: '5',
    username: 'Diana',
    content: 'Just joined! This looks like a great discussion.',
    timestamp: new Date(Date.now() - 60000),
    type: 'text'
  },
]

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

  // TODO: Replace with LiveKit connection status
  const isConnected = true

  // TODO: Replace with actual LiveKit participant data
  const participants = mockUsers

  // TODO: Replace with actual LiveKit message data
  const messages = mockMessages

  // TODO: Implement LiveKit message sending
  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content)
    // This will be replaced with LiveKit message sending logic
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
                variant={isConnected ? "default" : "destructive"}
                className="flex items-center space-x-1"
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
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
                placeholder={`Message ${decodedRoom}...`}
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