import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Crown } from 'lucide-react'

interface User {
  id: string
  username: string
  isOnline: boolean
  avatar?: string
}

interface UserListProps {
  users: User[]
  currentUsername: string
}

export function UserList({ users, currentUsername }: UserListProps) {
  // TODO: Replace with LiveKit participant management
  // TODO: Add participant roles (host, moderator, etc.)
  // TODO: Implement participant actions (mute, kick, etc.)

  const getInitials = (username: string): string => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sortedUsers = [...users].sort((a, b) => {
    // Current user first, then online users, then offline users
    if (a.username === currentUsername) return -1
    if (b.username === currentUsername) return 1
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    return a.username.localeCompare(b.username)
  })

  return (
    <div className="space-y-1 p-2">
      {sortedUsers.map((user) => (
        <div
          key={user.id}
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-accent/50 ${
            user.username === currentUsername ? 'bg-accent/30' : ''
          }`}
        >
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={`${user.username}'s avatar`} />
              <AvatarFallback className="text-xs">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            
            {/* Online Status Indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
              aria-label={user.isOnline ? 'Online' : 'Offline'}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={`text-sm font-medium truncate ${
                user.isOnline ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {user.username}
                {user.username === currentUsername && (
                  <span className="text-xs text-muted-foreground ml-1">(You)</span>
                )}
              </p>
              
              {/* TODO: Add role indicators */}
              {user.username === currentUsername && (
                <Crown className="h-3 w-3 text-yellow-500" aria-label="Host" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {user.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          {/* Status Badge */}
          <Badge 
            variant={user.isOnline ? "default" : "secondary"}
            className="text-xs px-2 py-0.5"
          >
            {user.isOnline ? 'Online' : 'Away'}
          </Badge>
        </div>
      ))}

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <User className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No participants yet</p>
        </div>
      )}
    </div>
  )
}