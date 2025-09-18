'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Users, 
  ArrowRight, 
  Clock, 
  Star, 
  Sparkles,
  Brain,
  Zap,
  Activity,
  TrendingUp,
  MessageCircle
} from 'lucide-react'

interface FormData {
  username: string
  room: string
}

interface FormErrors {
  username?: string
  room?: string
}

const Dashboard = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({ username: '', room: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation function
  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'username':
        if (!value.trim()) return 'Username is required'
        if (value.trim().length < 2) return 'Username must be at least 2 characters'
        if (value.trim().length > 20) return 'Username must be less than 20 characters'
        if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) return 'Username can only contain letters, numbers, hyphens, and underscores'
        break
      case 'room':
        if (!value.trim()) return 'Room name is required'
        if (value.trim().length < 2) return 'Room name must be at least 2 characters'
        if (value.trim().length > 30) return 'Room name must be less than 30 characters'
        if (!/^[a-zA-Z0-9_-\s]+$/.test(value.trim())) return 'Room name can only contain letters, numbers, spaces, hyphens, and underscores'
        break
    }
    return undefined
  }, [])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field as keyof FormData, value)
      if (error) {
        newErrors[field as keyof FormErrors] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [formData, validateField])

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error if field becomes valid
    if (touchedFields.has(field)) {
      const fieldError = validateField(field, value)
      if (!fieldError && errors[field]) {
        setErrors(prev => {
          const updated = { ...prev }
          delete updated[field]
          return updated
        })
      }
    }
  }, [touchedFields, errors, validateField])

  // Handle field blur
  const handleFieldBlur = useCallback((field: keyof FormData, value: string) => {
    setTouchedFields(prev => new Set(prev).add(field))
    const fieldError = validateField(field, value)
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }))
    }
  }, [validateField])

  // Check if should show error
  const shouldShowError = useCallback((field: keyof FormData): boolean => {
    return touchedFields.has(field) && Boolean(errors[field])
  }, [touchedFields, errors])

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields(new Set(['username', 'room']))
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Encode URL parameters to handle special characters
      const encodedRoom = encodeURIComponent(formData.room.trim())
      const encodedUsername = encodeURIComponent(formData.username.trim())
      
      // Navigate to chat room
      router.push(`/chat/${encodedRoom}?username=${encodedUsername}`)
    } catch (error) {
      console.error('Navigation error:', error)
      setIsSubmitting(false)
    }
  }, [formData, validateForm, router])

  // Mock stats data
  const stats = [
    { icon: Activity, label: 'Active Users', value: '1.2K+', trend: '+12%' },
    { icon: MessageCircle, label: 'Messages Today', value: '8.5K+', trend: '+8%' },
    { icon: Brain, label: 'Memory Contexts', value: '450+', trend: '+15%' },
    { icon: TrendingUp, label: 'Response Speed', value: '<100ms', trend: 'Optimal' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Welcome to Your Dashboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start a new conversation or check your AI chat statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="border-border/50 hover:border-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">
                        {stat.value}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            stat.trend.includes('+') 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {stat.trend}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Start Chat Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Start New Chat
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Join or create a room to chat with AI
                  </p>
                </div>
              </div>
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
                      value={formData.username}
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
                      value={formData.room}
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
                      <span>Start Chat</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Recent Rooms
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Favorite Chats
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Memory Settings
              </Button>
            </CardContent>
          </Card>

          {/* AI Status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>AI Status</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 ml-auto">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="text-green-500 font-medium">&lt;100ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory Active</span>
                <span className="text-green-500 font-medium">Yes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Model</span>
                <span className="font-medium">Gemini Pro</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard