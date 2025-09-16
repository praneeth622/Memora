'use client'

import React, { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Bot } from 'lucide-react'

interface Message {
  id: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'system'
}

interface MessageListProps {
  messages: Message[]
  currentUsername: string
}

export function MessageList({ messages, currentUsername }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // TODO: Replace with LiveKit message handling
  // TODO: Add message reactions and replies
  // TODO: Implement message editing and deletion
  // TODO: Add file/image sharing capabilities

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getInitials = (username: string): string => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (timestamp: Date): string => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  const isCurrentUser = (username: string): boolean => {
    return username === currentUsername
  }

  const isSystemMessage = (message: Message): boolean => {
    return message.type === 'system'
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto p-4 space-y-4"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Be the first to start the conversation! Send a message to get things going.
          </p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwn = isCurrentUser(message.username)
            const isSystem = isSystemMessage(message)
            const showAvatar = !isOwn && !isSystem
            const prevMessage = index > 0 ? messages[index - 1] : null
            const isGrouped = prevMessage && 
              prevMessage.username === message.username && 
              prevMessage.type === message.type &&
              (message.timestamp.getTime() - prevMessage.timestamp.getTime()) < 300000 // 5 minutes

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    <Bot className="h-3 w-3 mr-1" />
                    {message.content}
                  </Badge>
                </div>
              )
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                  isGrouped ? 'mt-1' : 'mt-4'
                }`}
              >
                <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {showAvatar && !isGrouped && (
                    <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={`${message.username}'s avatar`} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {/* Spacer for grouped messages */}
                  {showAvatar && isGrouped && (
                    <div className={`flex-shrink-0 w-8 ${isOwn ? 'ml-2' : 'mr-2'}`} />
                  )}

                  {/* Message Content */}
                  <div className="flex flex-col">
                    {/* Username and Timestamp */}
                    {!isOwn && !isGrouped && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {message.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg px-3 py-2 break-words ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      
                      {/* Timestamp for own messages */}
                      {isOwn && (
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}