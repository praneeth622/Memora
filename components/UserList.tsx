'use client'

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { User, Bot, Users, ChevronLeft, ChevronRight, Crown } from 'lucide-react'

// Type definitions
export interface Participant {
  id: string
  name: string
  type: 'user' | 'bot'
  isOnline: boolean
  avatar?: string
  role?: 'host' | 'moderator' | 'participant'
  joinedAt?: Date
}

export interface UserListProps {
  participants: Participant[]
  currentUserId?: string
  className?: string
  showRoles?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  onParticipantClick?: (participant: Participant) => void
}

/**
 * UserList Component
 * 
 * Displays participant list with:
 * - Circular avatars with initials fallback
 * - Visual distinction between AI bots and human users
 * - Collapsible sidebar for mobile devices
 * - Online/offline status indicators
 * - Role indicators (host, moderator)
 * - Accessible empty states and keyboard navigation
 */
export function UserList({
  participants,
  currentUserId,
  className = '',
  showRoles = true,
  collapsible = true,
  defaultCollapsed = false,
  onParticipantClick
}: UserListProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

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
   * Sort participants by priority:
   * 1. Current user first
   * 2. Online users before offline
   * 3. Bots after humans
   * 4. Alphabetical by name
   */
  const sortedParticipants = [...participants].sort((a, b) => {
    // Current user always first
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    
    // Online status
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    
    // User type (humans before bots)
    if (a.type === 'user' && b.type === 'bot') return -1
    if (a.type === 'bot' && b.type === 'user') return 1
    
    // Alphabetical
    return a.name.localeCompare(b.name)
  })

  /**
   * Get role icon component
   */
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'host':
        return <Crown className="h-3 w-3 text-yellow-500" aria-label="Host" />
      case 'moderator':
        return <Crown className="h-3 w-3 text-blue-500" aria-label="Moderator" />
      default:
        return null
    }
  }

  /**
   * Handle participant click with optional callback
   */
  const handleParticipantClick = (participant: Participant) => {
    onParticipantClick?.(participant)
  }

  /**
   * Render participant item
   */
  const renderParticipant = (participant: Participant) => {
    const isCurrentUser = participant.id === currentUserId
    const isBot = participant.type === 'bot'

    return (
      <div
        key={participant.id}
        className={`group flex items-center space-x-3 p-2.5 rounded-lg transition-all duration-200 ${
          isCurrentUser 
            ? 'bg-primary/10 border border-primary/20' 
            : 'hover:bg-accent/50 cursor-pointer'
        } ${
          onParticipantClick ? 'focus:outline-none focus:ring-2 focus:ring-primary/20' : ''
        }`}
        onClick={() => !isCurrentUser && handleParticipantClick(participant)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isCurrentUser) {
            e.preventDefault()
            handleParticipantClick(participant)
          }
        }}
        tabIndex={onParticipantClick && !isCurrentUser ? 0 : -1}
        role={onParticipantClick ? "button" : "listitem"}
        aria-label={`${participant.name}${isCurrentUser ? ' (You)' : ''}, ${
          participant.isOnline ? 'online' : 'offline'
        }${isBot ? ', AI assistant' : ', user'}${
          participant.role ? `, ${participant.role}` : ''
        }`}
      >
        {/* Avatar with status indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className={`h-9 w-9 transition-all duration-200 ${
            participant.isOnline ? 'ring-2 ring-green-500/20' : 'opacity-75'
          }`}>
            <AvatarImage 
              src={participant.avatar} 
              alt={`${participant.name}'s avatar`} 
            />
            <AvatarFallback className={`text-sm font-medium transition-colors ${
              isBot 
                ? 'bg-primary/10 text-primary' 
                : isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isBot ? (
                <Bot className="h-4 w-4" aria-hidden="true" />
              ) : (
                getInitials(participant.name)
              )}
            </AvatarFallback>
          </Avatar>
          
          {/* Online status indicator */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background transition-colors ${
              participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
            aria-hidden="true"
          />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className={`text-sm font-medium truncate transition-colors ${
              participant.isOnline ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {participant.name}
              {isCurrentUser && (
                <span className="text-xs text-muted-foreground ml-1 font-normal">
                  (You)
                </span>
              )}
            </p>
            
            {/* Role indicator */}
            {showRoles && participant.role && getRoleIcon(participant.role)}
            
            {/* Bot badge */}
            {isBot && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-auto">
                <Bot className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                AI
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {participant.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
    )
  }

  /**
   * Render participant list content
   */
  const renderParticipantList = () => (
    <div className="space-y-1 p-3">
      {sortedParticipants.map(renderParticipant)}
      
      {/* Empty state */}
      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            No participants yet
          </h3>
          <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
            Participants will appear here when they join the conversation.
          </p>
        </div>
      )}
    </div>
  )

  // Mobile view with sheet
  const mobileView = (
    <div className="md:hidden">
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-4 right-4 z-40 shadow-lg"
            aria-label={`Show participants (${participants.length})`}
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {participants.filter(p => p.isOnline).length}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Participants ({participants.length})</span>
            </SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto">
            {renderParticipantList()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  // Desktop sidebar
  const desktopView = (
    <aside 
      className={`hidden md:flex flex-col bg-card/30 border-r border-border transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-64'
      } ${className}`}
      aria-label="Participants sidebar"
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Participants ({participants.length})
          </h2>
        )}
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // Collapsed view - show only avatars
          <div className="space-y-2 p-2">
            {sortedParticipants.slice(0, 8).map((participant) => (
              <div
                key={participant.id}
                className="relative flex justify-center"
                title={`${participant.name} - ${participant.isOnline ? 'Online' : 'Offline'}`}
              >
                <Avatar className={`h-8 w-8 ${
                  participant.isOnline ? 'ring-2 ring-green-500/20' : 'opacity-75'
                }`}>
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback className={`text-xs ${
                    participant.type === 'bot' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {participant.type === 'bot' ? (
                      <Bot className="h-3 w-3" />
                    ) : (
                      getInitials(participant.name)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${
                    participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
            ))}
            {participants.length > 8 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{participants.length - 8}
              </div>
            )}
          </div>
        ) : (
          renderParticipantList()
        )}
      </div>
    </aside>
  )

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  )
}