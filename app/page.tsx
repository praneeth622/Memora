'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MessageCircle, Users, ArrowRight } from 'lucide-react'

interface FormErrors {
  username?: string
  room?: string
}

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const validateField = (fieldName: string, value: string): string | undefined => {
    const trimmedValue = value.trim()
    
    if (fieldName === 'username') {
      if (!trimmedValue) {
        return 'Username is required'
      }
    }
    
    if (fieldName === 'room') {
      if (!trimmedValue) {
        return 'Room name is required'
      }
    }
    
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const usernameError = validateField('username', username)
    const roomError = validateField('room', room)
    
    if (usernameError) newErrors.username = usernameError
    if (roomError) newErrors.room = roomError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === 'username') {
      setUsername(value)
    } else if (fieldName === 'room') {
      setRoom(value)
    }
    
    // Clear error for this field when user starts typing
    if (errors[fieldName as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }))
    }
  }

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName))
    
    // Validate field on blur if it has been touched
    const error = validateField(fieldName, value)
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields(new Set(['username', 'room']))
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Encode URL parameters to handle special characters
      const encodedRoom = encodeURIComponent(room.trim())
      const encodedUsername = encodeURIComponent(username.trim())
      
      // Navigate to chat room
      router.push(`/chat/${encodedRoom}?username=${encodedUsername}`)
    } catch (error) {
      console.error('Navigation error:', error)
      setIsSubmitting(false)
    }
  }

  const shouldShowError = (fieldName: string): boolean => {
    return touchedFields.has(fieldName) && !!errors[fieldName as keyof FormErrors]
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Join Chat Room
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your details to start chatting with others
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Username Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="username" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Username
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  onBlur={(e) => handleFieldBlur('username', e.target.value)}
                  className={`pl-10 transition-colors ${
                    shouldShowError('username') 
                      ? 'border-destructive focus-visible:ring-destructive' 
                      : ''
                  }`}
                  aria-invalid={shouldShowError('username')}
                  aria-describedby={shouldShowError('username') ? 'username-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {shouldShowError('username') && (
                <p 
                  id="username-error" 
                  className="text-sm text-destructive font-medium"
                  role="alert"
                >
                  {errors.username}
                </p>
              )}
            </div>

            {/* Room Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="room" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Room Name
              </Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="room"
                  type="text"
                  placeholder="Enter room name"
                  value={room}
                  onChange={(e) => handleFieldChange('room', e.target.value)}
                  onBlur={(e) => handleFieldBlur('room', e.target.value)}
                  className={`pl-10 transition-colors ${
                    shouldShowError('room') 
                      ? 'border-destructive focus-visible:ring-destructive' 
                      : ''
                  }`}
                  aria-invalid={shouldShowError('room')}
                  aria-describedby={shouldShowError('room') ? 'room-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {shouldShowError('room') && (
                <p 
                  id="room-error" 
                  className="text-sm text-destructive font-medium"
                  role="alert"
                >
                  {errors.room}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full transition-all duration-200 hover:shadow-md"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Join Room</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}