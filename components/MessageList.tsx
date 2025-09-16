'use client'

import React, { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, format } from 'date-fns'
import { Bot, User, MessageCircle } from 'lucide-react'

// Type definitions
export interface Message {
  id: string
  content: string
  timestamp: Date
  sender: {
    id: string
    name: string
    type: 'user' | 'bot'
    avatar?: string
  }
  type: 'text' | 'system'
}

export interface MessageListProps {
  messages: Message[]
  currentUserId?: string
  className?: string
  autoScroll?: boolean
}

/**
 * MessageList Component
 * 
 * Displays a scrollable list of chat messages with:
 * - Distinct styling for user vs bot messages
 * - Auto-scroll functionality for new messages
 * - Formatted timestamps with relative time
 * - Accessible empty states
 * - System message support
 */
export function MessageList({ 
  messages, 
  currentUserId, 
  className = '',
  autoScroll = true 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
    lastMessageCountRef.current = messages.length
  }, [messages, autoScroll])

  /**
   * Generate initials from name for avatar fallback
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Format timestamp with relative time and absolute time on hover
   */
  const formatTimestamp = (timestamp: Date): string => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  const formatAbsoluteTime = (timestamp: Date): string => {
    return format(timestamp, 'PPpp') // e.g., "Apr 29, 2023 at 3:45:12 PM"
  }

  /**
   * Check if message is from current user
   */
  const isCurrentUser = (senderId: string): boolean => {
    return currentUserId === senderId
  }

  /**
   * Check if message should be grouped with previous message
   * (same sender, within 5 minutes, same type)
   */
  const shouldGroupMessage = (currentMessage: Message, previousMessage: Message | null): boolean => {
    if (!previousMessage) return false
    
    const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime()
    const fiveMinutes = 5 * 60 * 1000
    
    return (
      previousMessage.sender.id === currentMessage.sender.id &&
      previousMessage.type === currentMessage.type &&
      timeDiff < fiveMinutes
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div 
        className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No messages yet
        </h3>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          Start the conversation by sending your first message. Messages will appear here as the chat progresses.
        </p>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto scroll-smooth ${className}`}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="p-4 space-y-1">
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null
          const isOwn = isCurrentUser(message.sender.id)
          const isBot = message.sender.type === 'bot'
          const isSystem = message.type === 'system'
          const isGrouped = shouldGroupMessage(message, previousMessage)

          // System messages
          if (isSystem) {
            return (
              <div key={message.id} className="flex justify-center py-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs px-3 py-1.5 bg-muted/50 text-muted-foreground border-0"
                >
                  <Bot className="h-3 w-3 mr-1.5" aria-hidden="true" />
                  <span>{message.content}</span>
                </Badge>
              </div>
            )
          }

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                isGrouped ? 'mt-0.5' : 'mt-4'
              }`}
            >
              <div 
                className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${
                  isOwn ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar - only show for non-grouped messages */}
                {!isOwn && !isGrouped && (
                  <div className="flex-shrink-0 mr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={message.sender.avatar} 
                        alt={`${message.sender.name}'s avatar`} 
                      />
                      <AvatarFallback className={`text-xs font-medium ${
                        isBot 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isBot ? (
                          <Bot className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          getInitials(message.sender.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Spacer for grouped messages */}
                {!isOwn && isGrouped && (
                  <div className="flex-shrink-0 w-8 mr-3" aria-hidden="true" />
                )}

                {/* Message content */}
                <div className="flex flex-col min-w-0">
                  {/* Sender name and timestamp for non-grouped messages */}
                  {!isOwn && !isGrouped && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-foreground flex items-center">
                        {message.sender.name}
                        {isBot && (
                          <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5">
                            <Bot className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                            Bot
                          </Badge>
                        )}
                      </span>
                      <time 
                        className="text-xs text-muted-foreground"
                        dateTime={message.timestamp.toISOString()}
                        title={formatAbsoluteTime(message.timestamp)}
                      >
                        {formatTimestamp(message.timestamp)}
                      </time>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 break-words ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : isBot
                        ? 'bg-accent/50 text-accent-foreground border border-border/50 rounded-bl-md'
                        : 'bg-muted text-muted-foreground rounded-bl-md'
                    }`}
                    role="article"
                    aria-label={`Message from ${message.sender.name}`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {/* Timestamp for own messages */}
                    {isOwn && (
                      <time 
                        className="text-xs opacity-70 mt-1.5 block text-right"
                        dateTime={message.timestamp.toISOString()}
                        title={formatAbsoluteTime(message.timestamp)}
                      >
                        {formatTimestamp(message.timestamp)}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </div>
  )
}