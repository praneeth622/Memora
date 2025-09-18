'use client'

import React from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Users, 
  ArrowRight, 
  Brain, 
  Zap, 
  Shield, 
  Sparkles,
  Bot,
  MessageSquare,
  Clock,
  Star,
  LayoutDashboard
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-pattern" />
        <div className="relative container mx-auto px-4 pt-20 pb-16">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Memora AI Chat
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Experience intelligent conversations with an AI that remembers. 
                  Built for seamless real-time communication with persistent memory.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-12">
              <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mx-auto">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Smart Memory</h3>
                  <p className="text-sm text-muted-foreground">
                    AI remembers your conversations and preferences across sessions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mx-auto">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Real-time</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant responses powered by WebRTC and LiveKit technology
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 mx-auto">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Isolated memory spaces and encrypted real-time communication
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Gemini AI
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                LiveKit WebRTC
              </Badge>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                Next.js 14
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
                mem0.ai
              </Badge>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                asChild
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl animate-none hover:animate-none"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Get Started
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 border-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
              >
                <Link href="/features">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}